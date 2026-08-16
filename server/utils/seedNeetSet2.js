const mongoose = require('mongoose');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const connectDB = require('../config/db');
require('dotenv').config();

// Answer Key mapping from PDF Set 2 Pages 18 & 19:
// Option A -> 0, B -> 1, C -> 2, D -> 3
const rawAnswerKeySet2 = {
  1: 'B', 2: 'B', 3: 'A', 4: 'A', 5: 'B', 6: 'B', 7: 'A', 8: 'B', 9: 'B', 10: 'A',
  11: 'B', 12: 'A', 13: 'B', 14: 'B', 15: 'A', 16: 'A', 17: 'A', 18: 'A', 19: 'A', 20: 'A',
  21: 'B', 22: 'B', 23: 'A', 24: 'A', 25: 'A', 26: 'A', 27: 'B', 28: 'B', 29: 'C', 30: 'A',
  31: 'B', 32: 'B', 33: 'B', 34: 'B', 35: 'B', 36: 'B', 37: 'C', 38: 'B', 39: 'B', 40: 'B',
  41: 'B', 42: 'B', 43: 'A', 44: 'B', 45: 'B', 46: 'A', 47: 'B', 48: 'A', 49: 'B', 50: 'B',
  51: 'C', 52: 'A', 53: 'B', 54: 'B', 55: 'B', 56: 'B', 57: 'A', 58: 'A', 59: 'B', 60: 'C',
  61: 'B', 62: 'A', 63: 'B', 64: 'A', 65: 'B', 66: 'A', 67: 'B', 68: 'B', 69: 'B', 70: 'B',
  71: 'B', 72: 'C', 73: 'B', 74: 'B', 75: 'B', 76: 'A', 77: 'C', 78: 'A', 79: 'A', 80: 'A',
  81: 'B', 82: 'B', 83: 'C', 84: 'B', 85: 'B', 86: 'C', 87: 'B', 88: 'B', 89: 'A', 90: 'A',
  91: 'B', 92: 'A', 93: 'A', 94: 'B', 95: 'B', 96: 'B', 97: 'C', 98: 'B', 99: 'B', 100: 'A',
  101: 'B', 102: 'B', 103: 'A', 104: 'B', 105: 'B', 106: 'B', 107: 'A', 108: 'B', 109: 'A', 110: 'B',
  111: 'A', 112: 'A', 113: 'B', 114: 'B', 115: 'A', 116: 'A', 117: 'A', 118: 'B', 119: 'A', 120: 'A',
  121: 'B', 122: 'A', 123: 'B', 124: 'B', 125: 'A', 126: 'A', 127: 'B', 128: 'B', 129: 'A', 130: 'A',
  131: 'B', 132: 'B', 133: 'B', 134: 'B', 135: 'B', 136: 'B', 137: 'B', 138: 'C', 139: 'B', 140: 'B',
  141: 'B', 142: 'B', 143: 'B', 144: 'A', 145: 'A', 146: 'B', 147: 'C', 148: 'B', 149: 'A', 150: 'A',
  151: 'A', 152: 'B', 153: 'B', 154: 'A', 155: 'A', 156: 'A', 157: 'A', 158: 'A', 159: 'B', 160: 'A',
  161: 'B', 162: 'B', 163: 'B', 164: 'A', 165: 'B', 166: 'B', 167: 'B', 168: 'B', 169: 'B', 170: 'B',
  171: 'A', 172: 'A', 173: 'B', 174: 'A', 175: 'B', 176: 'B', 177: 'A', 178: 'A', 179: 'A', 180: 'B'
};

const mapOptionIndex = (letter) => {
  if (letter === 'A') return 0;
  if (letter === 'B') return 1;
  if (letter === 'C') return 2;
  if (letter === 'D') return 3;
  return 0;
};

// All 180 Questions from NEET PRACTICE TEST – SET 2
const allSet2Questions = [
  // SECTION A: PHYSICS (Q1 - Q45)
  { num: 1, subject: 'Physics', text: 'The value of sin 60° is', opts: ['1/2', '√3/2', '1', '0'] },
  { num: 2, subject: 'Physics', text: 'The value of cos 30° is', opts: ['1/2', '√3/2', '1', '0'] },
  { num: 3, subject: 'Physics', text: 'The value of tan 30° is', opts: ['1/√3', '√3', '1', '0'] },
  { num: 4, subject: 'Physics', text: 'cot θ is defined as', opts: ['cos θ / sin θ', 'sin θ / cos θ', '1 / cos θ', '1 / sin θ'] },
  { num: 5, subject: 'Physics', text: 'cosec θ is defined as', opts: ['1 / tan θ', '1 / sin θ', '1 / cos θ', '1 / cot θ'] },
  { num: 6, subject: 'Physics', text: 'sec θ is defined as', opts: ['1 / sin θ', '1 / cos θ', '1 / tan θ', '1 / cot θ'] },
  { num: 7, subject: 'Physics', text: 'If cos θ = 4/5 (θ acute), then sin θ is', opts: ['3/5', '4/3', '5/3', '5/4'] },
  { num: 8, subject: 'Physics', text: 'tan θ is equal to', opts: ['sin θ / sec θ', 'sin θ / cos θ', 'cos θ / cosec θ', 'cot θ / sin θ'] },
  { num: 9, subject: 'Physics', text: 'sin²θ + cos²θ is equal to', opts: ['0', '1', '2', 'tan²θ'] },
  { num: 10, subject: 'Physics', text: '1 + tan²θ is equal to', opts: ['sec²θ', 'cosec²θ', 'cos²θ', 'sin²θ'] },
  { num: 11, subject: 'Physics', text: 'If x = a sin θ and y = a cos θ, then x² + y² equals', opts: ['a', 'a²', '2a', '0'] },
  { num: 12, subject: 'Physics', text: 'The general term T(r+1) in the binomial expansion of (a + b)ⁿ is', opts: ['ⁿCᵣ aⁿ⁻ʳ bʳ', 'ⁿCᵣ aʳ bⁿ⁻ʳ', 'ⁿPᵣ aʳ', 'r·aʳ'] },
  { num: 13, subject: 'Physics', text: 'The coefficient of x² in the expansion of (1 + x)⁵ is', opts: ['5', '10', '15', '20'] },
  { num: 14, subject: 'Physics', text: 'For small x, (1 + x)⁻¹ is approximately', opts: ['1 + x', '1 - x', '1 - 2x', 'x - 1'] },
  { num: 15, subject: 'Physics', text: 'Using binomial approximation, (1 - 0.02)⁴ is approximately', opts: ['0.92', '0.98', '1.08', '0.96'] },
  { num: 16, subject: 'Physics', text: 'For small x, the binomial approximation (1 + x)ⁿ ≈', opts: ['1 + nx', '1 - nx', 'nx', '1 + x'] },
  { num: 17, subject: 'Physics', text: 'If a physical quantity is (1 - v²/c²)⁻¹/² and v << c, its approximate value is', opts: ['1 + v²/2c²', '1 - v²/2c²', '1 + v²/c²', '1'] },
  { num: 18, subject: 'Physics', text: 'If a physical quantity is (1 + v²/c²)¹/² and v << c, its approximate value is', opts: ['1 - v²/2c²', '1 + v²/2c²', '1 - v²/c²', '1'] },
  { num: 19, subject: 'Physics', text: 'The sum of first n odd natural numbers is', opts: ['n²', 'n(n+1)', 'n(n-1)', '2n'] },
  { num: 20, subject: 'Physics', text: 'The sum of squares of first n natural numbers is', opts: ['n(n+1)(2n+1)/6', 'n(n+1)/2', 'n²(n+1)²/4', 'n(n-1)/2'] },
  { num: 21, subject: 'Physics', text: 'In an AP with first term 3 and common difference 4, the 6th term is', opts: ['19', '23', '27', '15'] },
  { num: 22, subject: 'Physics', text: 'If the nth term of an AP is (2n + 1), the common difference is', opts: ['1', '2', '3', '4'] },
  { num: 23, subject: 'Physics', text: 'Sum of first n natural numbers is', opts: ['n(n+1)/2', 'n(n-1)/2', 'n²', 'n(n+1)'] },
  { num: 24, subject: 'Physics', text: 'The sum of n terms of an AP is Sₙ = n/2 [2a + (n-1)d]. If a = 2, d = 3, n = 5, Sₙ is', opts: ['40', '35', '50', '45'] },
  { num: 25, subject: 'Physics', text: 'The arithmetic mean of two numbers a and b is', opts: ['(a+b)/2', 'ab', '√(ab)', '2ab/(a+b)'] },
  { num: 26, subject: 'Physics', text: 'The geometric mean of 4 and 9 is', opts: ['6', '6.5', '13/2', '36'] },
  { num: 27, subject: 'Physics', text: 'In a GP with first term 5 and common ratio 3, the 4th term is', opts: ['45', '135', '15', '125'] },
  { num: 28, subject: 'Physics', text: 'The common ratio of the GP 81, 27, 9, 3, ... is', opts: ['3', '1/3', '-3', '9'] },
  { num: 29, subject: 'Physics', text: 'The nth term of a geometric progression with first term a and common ratio r is', opts: ['a + (n-1)r', 'arⁿ', 'arⁿ⁻¹', 'a/rⁿ⁻¹'] },
  { num: 30, subject: 'Physics', text: 'Sum of an infinite GP with |r| < 1 is', opts: ['a/(1-r)', 'a(1-r)', 'a/(1+r)', 'ar/(1-r)'] },
  { num: 31, subject: 'Physics', text: 'The sum to infinity of the series 4 + 2 + 1 + 1/2 + ... is', opts: ['6', '8', '4', '16'] },
  { num: 32, subject: 'Physics', text: 'On a displacement-time graph, the slope gives', opts: ['acceleration', 'velocity', 'displacement', 'force'] },
  { num: 33, subject: 'Physics', text: 'The area under an acceleration-time graph gives', opts: ['displacement', 'change in velocity', 'force', 'jerk'] },
  { num: 34, subject: 'Physics', text: 'For a velocity-time graph, the slope of the line gives', opts: ['displacement', 'acceleration', 'velocity', 'distance'] },
  { num: 35, subject: 'Physics', text: 'The area under a velocity-time graph gives', opts: ['acceleration', 'displacement', 'force', 'momentum'] },
  { num: 36, subject: 'Physics', text: 'A graph of y versus x² that is a straight line through the origin indicates', opts: ['y ∝ x', 'y ∝ x²', 'y ∝ 1/x', 'y ∝ x³'] },
  { num: 37, subject: 'Physics', text: 'If two quantities are related as y = k/x, the graph between y and x is a', opts: ['straight line', 'parabola', 'rectangular hyperbola', 'circle'] },
  { num: 38, subject: 'Physics', text: 'log(1/a) is equal to', opts: ['log a', '-log a', '1/log a', '0'] },
  { num: 39, subject: 'Physics', text: 'If log₁₀ 3 = 0.477, then log₁₀ 9 is approximately', opts: ['0.477', '0.954', '1.431', '0.238'] },
  { num: 40, subject: 'Physics', text: 'The derivative of xⁿ with respect to x is', opts: ['nxⁿ', 'nxⁿ⁻¹', 'xⁿ⁻¹', 'n·x'] },
  { num: 41, subject: 'Physics', text: 'The integral of xⁿ dx (n ≠ -1) is', opts: ['xⁿ⁺¹ + C', 'xⁿ⁺¹/(n+1) + C', 'nxⁿ⁻¹ + C', 'xⁿ/n + C'] },
  { num: 42, subject: 'Physics', text: 'If v = dx/dt and a = dv/dt, then acceleration in terms of x is', opts: ['dx/dt', 'd²x/dt²', 'd²x/dt', 'dt²/dx'] },
  { num: 43, subject: 'Physics', text: 'The derivative of eˣ with respect to x is', opts: ['eˣ', 'x·eˣ⁻¹', '1/x', 'x·eˣ'] },
  { num: 44, subject: 'Physics', text: 'The derivative of ln x with respect to x is', opts: ['x', '1/x', 'ln x', 'eˣ'] },
  { num: 45, subject: 'Physics', text: 'The integral of a constant k dx is', opts: ['k', 'kx + C', 'k/x + C', '0'] },

  // SECTION B: CHEMISTRY (Q46 - Q90)
  { num: 46, subject: 'Chemistry', text: "Dalton's atomic theory proposed that atoms of different elements differ in", opts: ['mass and properties', 'charge only', 'size only', 'colour only'] },
  { num: 47, subject: 'Chemistry', text: 'Which law states that matter can neither be created nor destroyed in a chemical reaction?', opts: ['Law of definite proportions', 'Law of conservation of mass', 'Law of multiple proportions', "Gay-Lussac's law"] },
  { num: 48, subject: 'Chemistry', text: 'The law of conservation of mass was verified experimentally by', opts: ['Lavoisier', 'Dalton', 'Avogadro', 'Berzelius'] },
  { num: 49, subject: 'Chemistry', text: "Proust's law of definite proportions states that a compound always contains its elements in", opts: ['variable ratios', 'a fixed ratio by mass', 'equal moles', 'equal volumes'] },
  { num: 50, subject: 'Chemistry', text: 'The law of reciprocal proportions was proposed by', opts: ['Dalton', 'Richter', 'Proust', 'Avogadro'] },
  { num: 51, subject: 'Chemistry', text: "Gay-Lussac's law of combining volumes applies to reactions between", opts: ['solids', 'liquids', 'gases', 'solutions'] },
  { num: 52, subject: 'Chemistry', text: 'A chemical equation is said to be balanced when the number of atoms of each element is', opts: ['equal on both sides', 'different on both sides', 'doubled on the product side', 'halved on the reactant side'] },
  { num: 53, subject: 'Chemistry', text: 'Isotopes of an element have the same number of', opts: ['neutrons', 'protons', 'nucleons', 'mass number'] },
  { num: 54, subject: 'Chemistry', text: 'Isobars are atoms of different elements having the same', opts: ['atomic number', 'mass number', 'number of neutrons', 'number of electrons'] },
  { num: 55, subject: 'Chemistry', text: 'The number of protons in an atom is called its', opts: ['mass number', 'atomic number', 'atomic mass', 'valency'] },
  { num: 56, subject: 'Chemistry', text: 'The mass number of an atom is the sum of', opts: ['protons and electrons', 'protons and neutrons', 'neutrons and electrons', 'protons only'] },
  { num: 57, subject: 'Chemistry', text: 'The charge on a proton is', opts: ['+1.6 × 10⁻¹⁹ C', '-1.6 × 10⁻¹⁹ C', '0 C', '+3.2 × 10⁻¹⁹ C'] },
  { num: 58, subject: 'Chemistry', text: 'The mass of an electron is approximately', opts: ['9.1 × 10⁻³¹ kg', '1.6 × 10⁻²⁷ kg', '1.67 × 10⁻²⁷ kg', '9.1 × 10⁻²⁷ kg'] },
  { num: 59, subject: 'Chemistry', text: 'An atom is electrically neutral because the number of protons equals the number of', opts: ['neutrons', 'electrons', 'nucleons', 'isotopes'] },
  { num: 60, subject: 'Chemistry', text: 'The valence electrons of an atom are found in the', opts: ['nucleus', 'innermost shell', 'outermost shell', 'nucleolus'] },
  { num: 61, subject: 'Chemistry', text: 'One mole of any substance contains how many particles?', opts: ['6.022 × 10²²', '6.022 × 10²³', '6.022 × 10²⁴', '1.6 × 10⁻¹⁹'] },
  { num: 62, subject: 'Chemistry', text: 'The molar mass of NaCl is', opts: ['58.5 g/mol', '40 g/mol', '23 g/mol', '35.5 g/mol'] },
  { num: 63, subject: 'Chemistry', text: 'The molar mass of glucose (C₆H₁₂O₆) is', opts: ['150 g/mol', '180 g/mol', '120 g/mol', '342 g/mol'] },
  { num: 64, subject: 'Chemistry', text: 'The molar mass of CO₂ is', opts: ['44 g/mol', '28 g/mol', '32 g/mol', '40 g/mol'] },
  { num: 65, subject: 'Chemistry', text: 'The number of molecules present in 0.5 mole of any gas is', opts: ['6.022 × 10²³', '3.011 × 10²³', '1.2044 × 10²³', '12.044 × 10²³'] },
  { num: 66, subject: 'Chemistry', text: 'The number of moles present in 4 g of NaOH (molar mass 40 g/mol) is', opts: ['0.1', '0.4', '1', '4'] },
  { num: 67, subject: 'Chemistry', text: 'The volume occupied by one mole of an ideal gas at STP is', opts: ['11.2 L', '22.4 L', '44.8 L', '1 L'] },
  { num: 68, subject: 'Chemistry', text: 'The relationship between molar mass (M) and vapour density (VD) is', opts: ['M = VD', 'M = 2 × VD', 'M = VD/2', 'M = VD²'] },
  { num: 69, subject: 'Chemistry', text: 'The vapour density of a gas is 8. Its molar mass is', opts: ['8 g/mol', '16 g/mol', '4 g/mol', '32 g/mol'] },
  { num: 70, subject: 'Chemistry', text: 'Percentage composition of an element in a compound is used to determine its', opts: ['molecular formula directly', 'empirical formula', 'structural formula', 'oxidation state'] },
  { num: 71, subject: 'Chemistry', text: 'The empirical formula of a compound represents', opts: ['the exact number of atoms in a molecule', 'the simplest whole-number ratio of atoms', 'the molecular mass only', 'the structural arrangement of atoms'] },
  { num: 72, subject: 'Chemistry', text: 'If the empirical formula of a compound is CH₂O and its molecular mass is 180, the molecular formula is', opts: ['CH₂O', 'C₂H₄O₂', 'C₆H₁₂O₆', 'C₃H₆O₃'] },
  { num: 73, subject: 'Chemistry', text: 'The limiting reagent in a reaction is the reactant that', opts: ['is present in excess', 'gets completely consumed first', 'does not react', 'is a catalyst'] },
  { num: 74, subject: 'Chemistry', text: 'In the reaction N₂ + 3H₂ → 2NH₃, if 1 mol N₂ reacts with 2 mol H₂, the limiting reagent is', opts: ['N₂', 'H₂', 'NH₃', 'none'] },
  { num: 75, subject: 'Chemistry', text: 'The reactant that remains unreacted after a reaction is complete is called the', opts: ['limiting reagent', 'excess reagent', 'catalyst', 'product'] },
  { num: 76, subject: 'Chemistry', text: 'Percentage yield is calculated as', opts: ['(actual yield/theoretical yield) × 100', '(theoretical yield/actual yield) × 100', 'actual yield - theoretical yield', 'actual yield + theoretical yield'] },
  { num: 77, subject: 'Chemistry', text: 'Actual yield is always', opts: ['equal to theoretical yield', 'greater than theoretical yield', 'less than or equal to theoretical yield', 'independent of theoretical yield'] },
  { num: 78, subject: 'Chemistry', text: 'A solution containing a precisely known amount of substance in a known volume is called a', opts: ['standard solution', 'saturated solution', 'buffer solution', 'colloidal solution'] },
  { num: 79, subject: 'Chemistry', text: 'Molarity is defined as', opts: ['moles of solute per litre of solution', 'moles of solute per kg of solvent', 'mass of solute per litre', 'gram equivalents per litre'] },
  { num: 80, subject: 'Chemistry', text: 'The unit of molarity is', opts: ['mol/L', 'mol/kg', 'g/L', 'no unit'] },
  { num: 81, subject: 'Chemistry', text: 'Molality is defined as', opts: ['moles of solute per litre of solution', 'moles of solute per kg of solvent', 'gram equivalents per litre', 'mass percentage of solute'] },
  { num: 82, subject: 'Chemistry', text: 'The unit of molality is', opts: ['mol/L', 'mol/kg', 'g/mol', 'L/mol'] },
  { num: 83, subject: 'Chemistry', text: 'Mole fraction of a component has the unit of', opts: ['mol/L', 'mol/kg', 'no unit (dimensionless)', 'g/mol'] },
  { num: 84, subject: 'Chemistry', text: 'Normality of a solution is defined as', opts: ['moles of solute per litre of solution', 'gram equivalents of solute per litre of solution', 'moles of solute per kg of solvent', 'mass of solute per litre'] },
  { num: 85, subject: 'Chemistry', text: 'The relationship between normality (N) and molarity (M) is', opts: ['N = M', 'N = M × n-factor', 'N = M/n-factor', 'N = M + n-factor'] },
  { num: 86, subject: 'Chemistry', text: 'The n-factor of KMnO₄ in acidic medium is', opts: ['1', '3', '5', '7'] },
  { num: 87, subject: 'Chemistry', text: 'The equivalent mass of Ca(OH)₂ (molar mass 74) is', opts: ['74', '37', '24.67', '148'] },
  { num: 88, subject: 'Chemistry', text: 'The n-factor of H₂SO₄, when it is completely neutralised, is', opts: ['1', '2', '3', '4'] },
  { num: 89, subject: 'Chemistry', text: 'The molarity of a solution can be related to its density (d) and mass percentage (w) of solute through', opts: ['M = 1000 × d × w / molar mass', 'M = d/w', 'M = w/d', 'M = molar mass/d'] },
  { num: 90, subject: 'Chemistry', text: 'Parts per million (ppm) is generally used to express the concentration of', opts: ['very dilute solutions', 'concentrated solutions', 'pure solids', 'gases only'] },

  // SECTION C: BOTANY (Q91 - Q135)
  { num: 91, subject: 'Botany', text: 'The nucleus of the cell was discovered by', opts: ['Robert Hooke', 'Robert Brown', 'Rudolf Virchow', 'Anton van Leeuwenhoek'] },
  { num: 92, subject: 'Botany', text: "The term 'cell' is derived from the Latin word meaning", opts: ['small room', 'living unit', 'tiny box', 'wall'] },
  { num: 93, subject: 'Botany', text: 'The cell theory was proposed by', opts: ['Schleiden and Schwann', 'Hooke and Brown', 'Watson and Crick', 'Darwin and Wallace'] },
  { num: 94, subject: 'Botany', text: "The statement 'omnis cellula-e cellula' (all cells arise from pre-existing cells) was given by", opts: ['Robert Hooke', 'Rudolf Virchow', 'Robert Brown', 'Anton van Leeuwenhoek'] },
  { num: 95, subject: 'Botany', text: 'A cell that lacks a well-organised nucleus enclosed by a nuclear membrane is called', opts: ['eukaryotic', 'prokaryotic', 'multicellular', 'diploid'] },
  { num: 96, subject: 'Botany', text: 'A cell possessing a true, membrane-bound nucleus is termed', opts: ['prokaryotic', 'eukaryotic', 'acellular', 'anucleate'] },
  { num: 97, subject: 'Botany', text: 'In a prokaryotic cell, the genetic material lies in a region called the', opts: ['nucleus', 'nucleolus', 'nucleoid', 'chromatin'] },
  { num: 98, subject: 'Botany', text: 'The cell wall of most bacteria is composed mainly of', opts: ['cellulose', 'peptidoglycan (murein)', 'chitin', 'lignin'] },
  { num: 99, subject: 'Botany', text: 'Ribosomes in a prokaryotic cell are of which type?', opts: ['80S', '70S', '60S', '40S'] },
  { num: 100, subject: 'Botany', text: 'Small circular extra-chromosomal DNA found in bacteria are called', opts: ['plasmids', 'plastids', 'ribosomes', 'vacuoles'] },
  { num: 101, subject: 'Botany', text: 'The cell wall of plant cells is mainly composed of', opts: ['peptidoglycan', 'cellulose', 'chitin only', 'lignin only'] },
  { num: 102, subject: 'Botany', text: 'The plasma membrane is mainly composed of', opts: ['cellulose and lignin', 'lipids and proteins', 'chitin only', 'peptidoglycan'] },
  { num: 103, subject: 'Botany', text: 'The fluid mosaic model of the plasma membrane was proposed by', opts: ['Singer and Nicolson', 'Watson and Crick', 'Schleiden and Schwann', 'Robert Hooke'] },
  { num: 104, subject: 'Botany', text: 'The membrane-bound organelle responsible for aerobic respiration in eukaryotic cells is the', opts: ['chloroplast', 'mitochondrion', 'ribosome', 'lysosome'] },
  { num: 105, subject: 'Botany', text: "Which organelle is known as the 'powerhouse of the cell'?", opts: ['Chloroplast', 'Mitochondrion', 'Golgi apparatus', 'Ribosome'] },
  { num: 106, subject: 'Botany', text: 'Mitochondria possess their own', opts: ['cell wall', 'DNA and ribosomes', 'chlorophyll', 'cellulose'] },
  { num: 107, subject: 'Botany', text: 'The inner membrane of the mitochondrion is folded to form', opts: ['cristae', 'thylakoids', 'grana', 'cisternae'] },
  { num: 108, subject: 'Botany', text: 'Photosynthesis in eukaryotic plant cells occurs in the', opts: ['mitochondria', 'chloroplast', 'Golgi body', 'peroxisome'] },
  { num: 109, subject: 'Botany', text: 'Chloroplasts contain a green pigment called', opts: ['chlorophyll', 'carotene', 'xanthophyll', 'anthocyanin'] },
  { num: 110, subject: 'Botany', text: 'The stack of membrane-bound sacs in a chloroplast is called', opts: ['cristae', 'grana', 'stroma', 'matrix'] },
  { num: 111, subject: 'Botany', text: 'The fluid matrix of the chloroplast is called the', opts: ['stroma', 'grana', 'cristae', 'cytosol'] },
  { num: 112, subject: 'Botany', text: 'Organelles such as mitochondria and chloroplasts are called semi-autonomous because they contain', opts: ['their own DNA and ribosomes', 'a cell wall', 'no membrane', 'plasmids'] },
  { num: 113, subject: 'Botany', text: 'The endomembrane system includes the endoplasmic reticulum, Golgi apparatus and', opts: ['mitochondria', 'lysosomes and vacuoles', 'chloroplasts', 'ribosomes only'] },
  { num: 114, subject: 'Botany', text: 'The endoplasmic reticulum studded with ribosomes on its surface is mainly involved in', opts: ['lipid synthesis', 'protein synthesis', 'ATP production', 'photosynthesis'] },
  { num: 115, subject: 'Botany', text: 'The organelle responsible for packaging and modifying proteins for secretion is the', opts: ['Golgi apparatus', 'lysosome', 'ribosome', 'vacuole'] },
  { num: 116, subject: 'Botany', text: 'The Golgi apparatus was discovered by', opts: ['Camillo Golgi', 'Robert Hooke', 'Rudolf Virchow', 'Robert Brown'] },
  { num: 117, subject: 'Botany', text: 'The organelle containing hydrolytic enzymes for intracellular digestion is the', opts: ['lysosome', 'peroxisome', 'mitochondrion', 'ribosome'] },
  { num: 118, subject: 'Botany', text: 'Lysosomes are also called', opts: ['powerhouses', 'suicide bags of the cell', 'protein factories', 'storage sacs'] },
  { num: 119, subject: 'Botany', text: 'Peroxisomes are involved in the metabolism of', opts: ['fatty acids and hydrogen peroxide', 'starch', 'chlorophyll', 'nucleic acids'] },
  { num: 120, subject: 'Botany', text: 'The centrally located, membrane-bound sac used for storage in plant cells is the', opts: ['vacuole', 'lysosome', 'mitochondrion', 'ribosome'] },
  { num: 121, subject: 'Botany', text: 'In plant cells, the large central vacuole is filled with a fluid called', opts: ['cytoplasm', 'cell sap', 'plasma', 'stroma'] },
  { num: 122, subject: 'Botany', text: 'The cytoskeleton is composed mainly of', opts: ['microtubules and microfilaments', 'DNA and RNA', 'starch grains', 'peptidoglycan'] },
  { num: 123, subject: 'Botany', text: 'Cilia and flagella arise from a basal body which is structurally similar to a', opts: ['mitochondrion', 'centriole', 'ribosome', 'lysosome'] },
  { num: 124, subject: 'Botany', text: 'Centrioles are found in', opts: ['all plant cells', 'most animal cells', 'bacterial cells only', 'fungal cells only'] },
  { num: 125, subject: 'Botany', text: 'The chromosomal DNA of a eukaryotic cell is associated with proteins called', opts: ['histones', 'tubulins', 'actins', 'keratins'] },
  { num: 126, subject: 'Botany', text: 'The nuclear envelope contains pores that mainly allow', opts: ['exchange of materials between nucleus and cytoplasm', 'protein synthesis', 'energy production', 'photosynthesis'] },
  { num: 127, subject: 'Botany', text: 'Chromatin material condenses to form chromosomes during', opts: ['interphase', 'cell division', 'protein synthesis', 'respiration'] },
  { num: 128, subject: 'Botany', text: 'The site of ribosome synthesis within the nucleus is the', opts: ['nucleoid', 'nucleolus', 'chromatin', 'nuclear envelope'] },
  { num: 129, subject: 'Botany', text: 'The plant cell wall, apart from cellulose, also contains', opts: ['hemicellulose and pectin', 'peptidoglycan', 'chitin', 'keratin'] },
  { num: 130, subject: 'Botany', text: 'Plasmodesmata are cytoplasmic channels that connect', opts: ['adjacent plant cells', 'adjacent animal cells', 'nucleus and cytoplasm', 'chloroplast and mitochondria'] },
  { num: 131, subject: 'Botany', text: 'Which of the following is NOT a membrane-bound organelle?', opts: ['Mitochondrion', 'Ribosome', 'Golgi apparatus', 'Lysosome'] },
  { num: 132, subject: 'Botany', text: 'Ribosomes in eukaryotic cytoplasm are of which type?', opts: ['70S', '80S', '60S alone', '40S alone'] },
  { num: 133, subject: 'Botany', text: 'Which structure controls the entry and exit of materials into and out of a eukaryotic cell?', opts: ['Cell wall', 'Plasma membrane', 'Nucleolus', 'Cytoskeleton'] },
  { num: 134, subject: 'Botany', text: 'The process by which the cell membrane engulfs large particles is called', opts: ['diffusion', 'endocytosis', 'osmosis', 'exocytosis'] },
  { num: 135, subject: 'Botany', text: 'Osmosis refers to the movement of', opts: ['solute molecules across a membrane', 'water molecules across a selectively permeable membrane', 'gases only', 'ions actively'] },

  // SECTION D: ZOOLOGY (Q136 - Q180)
  { num: 136, subject: 'Zoology', text: 'A tissue is defined as a group of cells that are', opts: ['different in origin and function', 'similar in structure and perform a common function', 'always non-living', 'found only in plants'] },
  { num: 137, subject: 'Zoology', text: 'The study of tissues is called', opts: ['cytology', 'histology', 'anatomy', 'physiology'] },
  { num: 138, subject: 'Zoology', text: 'Animal tissues are broadly classified into how many main types?', opts: ['Two', 'Three', 'Four', 'Five'] },
  { num: 139, subject: 'Zoology', text: 'Which tissue covers the body surface and lines body cavities?', opts: ['Connective tissue', 'Epithelial tissue', 'Muscular tissue', 'Nervous tissue'] },
  { num: 140, subject: 'Zoology', text: 'Simple epithelium is mainly involved in', opts: ['protection and secretion only', 'diffusion, absorption, filtration and secretion', 'contraction', 'impulse conduction'] },
  { num: 141, subject: 'Zoology', text: 'Epithelium made of a single layer of cells is termed', opts: ['stratified epithelium', 'simple epithelium', 'compound epithelium', 'transitional epithelium'] },
  { num: 142, subject: 'Zoology', text: 'Stratified epithelium mainly functions in', opts: ['diffusion', 'protection', 'absorption', 'secretion'] },
  { num: 143, subject: 'Zoology', text: 'Epithelium made of multiple layers of cells, providing protection, is termed', opts: ['simple epithelium', 'stratified/compound epithelium', 'glandular epithelium', 'squamous epithelium only'] },
  { num: 144, subject: 'Zoology', text: 'Pseudostratified epithelium appears layered but actually consists of', opts: ['a single layer of cells of varying heights', 'multiple true layers', 'no distinct layers', 'only squamous cells'] },
  { num: 145, subject: 'Zoology', text: 'The basement membrane beneath epithelial tissue mainly provides', opts: ['mechanical support and anchoring', 'nutrient transport only', 'gas exchange', 'contraction'] },
  { num: 146, subject: 'Zoology', text: 'Cell junctions that hold epithelial cells tightly together and prevent leakage are called', opts: ['gap junctions', 'tight junctions', 'adhering junctions', 'desmosomes only'] },
  { num: 147, subject: 'Zoology', text: 'Which junction type forms a communicating channel linking the cytoplasm of adjoining cells?', opts: ['Tight junction', 'Adhering junction', 'Gap junction', 'Desmosome'] },
  { num: 148, subject: 'Zoology', text: 'Connective tissue develops mainly from the embryonic layer called', opts: ['ectoderm', 'mesoderm', 'endoderm', 'mesenchyme only in animals'] },
  { num: 149, subject: 'Zoology', text: 'The ground substance and fibers of connective tissue together constitute the', opts: ['matrix', 'cytoplasm', 'plasma', 'cell membrane'] },
  { num: 150, subject: 'Zoology', text: 'Collagen and elastin are examples of', opts: ['connective tissue fibers', 'muscle proteins', 'enzymes', 'hormones'] },
  { num: 151, subject: 'Zoology', text: 'Areolar connective tissue mainly functions to', opts: ['support and fill space between organs', 'transport gases', 'generate nerve impulses', 'contract and relax'] },
  { num: 152, subject: 'Zoology', text: 'Which connective tissue has cells embedded in a fluid matrix called plasma?', opts: ['Areolar tissue', 'Blood', 'Cartilage', 'Bone'] },
  { num: 153, subject: 'Zoology', text: 'White blood cells present in blood mainly function in', opts: ['oxygen transport', 'body defence and immunity', 'clotting only', 'nutrient storage'] },
  { num: 154, subject: 'Zoology', text: 'Red blood cells are mainly responsible for', opts: ['transport of oxygen and carbon dioxide', 'fighting infection', 'blood clotting', 'hormone secretion'] },
  { num: 155, subject: 'Zoology', text: 'Platelets in blood play a major role in', opts: ['blood clotting', 'oxygen transport', 'immunity', 'nutrient transport'] },
  { num: 156, subject: 'Zoology', text: 'Hyaline cartilage, the most common type, is found at the', opts: ['ends of long bones and in the nose', 'intervertebral discs only', 'ear pinna only', 'larynx only'] },
  { num: 157, subject: 'Zoology', text: 'Elastic cartilage, which provides flexibility, is found in the', opts: ['ear pinna', 'ends of long bones', 'intervertebral discs', 'trachea rings'] },
  { num: 158, subject: 'Zoology', text: 'Fibrous cartilage, which withstands pressure, is found in the', opts: ['intervertebral discs', 'ear pinna', 'nose tip', 'epiglottis'] },
  { num: 159, subject: 'Zoology', text: 'Bone cells that maintain the bone matrix are called', opts: ['chondrocytes', 'osteocytes', 'fibroblasts', 'myocytes'] },
  { num: 160, subject: 'Zoology', text: 'Compact bone differs from spongy bone in that it is', opts: ['denser and forms the outer layer', 'less dense and forms the outer layer', 'found only in cartilage', 'not calcified'] },
  { num: 161, subject: 'Zoology', text: 'Dense regular connective tissue that attaches muscle to bone is called', opts: ['ligament', 'tendon', 'cartilage', 'areolar tissue'] },
  { num: 162, subject: 'Zoology', text: 'Dense regular connective tissue that connects one bone to another is called', opts: ['tendon', 'ligament', 'cartilage', 'areolar tissue'] },
  { num: 163, subject: 'Zoology', text: 'Skeletal connective tissues, cartilage and bone, are collectively grouped as', opts: ['fluid connective tissue', 'supportive/skeletal connective tissue', 'loose connective tissue', 'vascular tissue'] },
  { num: 164, subject: 'Zoology', text: 'The three types of muscle tissue in the body are', opts: ['skeletal, smooth and cardiac', 'striated, unstriated and voluntary', 'red, white and pink', 'fast, slow and mixed'] },
  { num: 165, subject: 'Zoology', text: 'Which muscle type is voluntary and shows alternate light and dark bands (striations)?', opts: ['Smooth muscle', 'Skeletal (striated) muscle', 'Cardiac muscle', 'Areolar muscle'] },
  { num: 166, subject: 'Zoology', text: 'Skeletal muscle is attached to bones and is mainly responsible for', opts: ['involuntary movements', 'voluntary movements', 'heartbeat', 'peristalsis'] },
  { num: 167, subject: 'Zoology', text: 'Smooth muscle, unstriated and involuntary, is mainly found in the walls of', opts: ['the heart', 'blood vessels and the digestive tract', 'skeletal muscles only', 'bones'] },
  { num: 168, subject: 'Zoology', text: 'Cardiac muscle fibers are joined end to end by specialised junctions called', opts: ['synapses', 'intercalated discs', 'desmosomes only', 'tight junctions only'] },
  { num: 169, subject: 'Zoology', text: 'Nervous tissue is specialised for', opts: ['contraction', 'generation and conduction of nerve impulses', 'secretion of hormones', 'storage of fat'] },
  { num: 170, subject: 'Zoology', text: 'The basic structural and functional unit of nervous tissue is the', opts: ['osteocyte', 'neuron', 'myocyte', 'chondrocyte'] },
  { num: 171, subject: 'Zoology', text: 'A neuron consists of a cell body, dendrites and a long process called the', opts: ['axon', 'myelin sheath', 'synapse', 'node of Ranvier'] },
  { num: 172, subject: 'Zoology', text: 'The junction between two neurons across which nerve impulses pass is called a', opts: ['synapse', 'node of Ranvier', 'myelin sheath', 'dendrite'] },
  { num: 173, subject: 'Zoology', text: 'Neuroglial cells in nervous tissue mainly function to', opts: ['transmit impulses', 'support and protect neurons', 'contract', 'secrete mucus'] },
  { num: 174, subject: 'Zoology', text: 'An organ is formed when', opts: ['different tissues work together for a common function', 'a single tissue type multiplies', 'cells divide repeatedly', 'tissues remain isolated'] },
  { num: 175, subject: 'Zoology', text: 'A group of organs working together to perform a specific set of functions is called an', opts: ['organelle', 'organ system', 'tissue', 'cell'] },
  { num: 176, subject: 'Zoology', text: 'The skin is an example of an organ made up of', opts: ['only epithelial tissue', 'epithelial, connective, muscular and nervous tissue', 'only connective tissue', 'only muscular tissue'] },
  { num: 177, subject: 'Zoology', text: 'The exoskeleton of arthropods such as insects is primarily composed of', opts: ['chitin', 'cellulose', 'keratin', 'collagen'] },
  { num: 178, subject: 'Zoology', text: 'Adipose tissue cells mainly store fat in the form of', opts: ['large lipid droplets', 'glycogen granules', 'protein fibers', 'starch grains'] },
  { num: 179, subject: 'Zoology', text: 'Simple columnar epithelium with goblet cells is commonly found lining the', opts: ['intestine', 'skin', 'blood vessels', 'alveoli'] },
  { num: 180, subject: 'Zoology', text: 'Endocrine glands release their secretions', opts: ['through ducts', 'directly into the blood without ducts', 'onto the skin surface', 'into the digestive tract via ducts'] }
];

const seedNeetSet2Exam = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    let teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      teacher = await User.findOne({});
    }

    console.log('📝 Creating NEET PRACTICE TEST – SET 2 Exam...');

    await Exam.deleteMany({ title: /SET 2/i });

    const exam = await Exam.create({
      title: 'NEET PRACTICE TEST – SET 2 (Physics, Chemistry, Botany & Zoology)',
      description: 'Official 180-Question NEET Practice Test Set 2 covering Physics, Chemistry, Botany, and Zoology with complete step-by-step solutions and auto-grading.',
      bookletCode: 'NEET-SET-2-2026',
      subject: 'Physics, Chemistry, Botany, Zoology',
      durationMinutes: 180,
      defaultMarksPerQuestion: 4,
      defaultNegativeMarks: 1,
      isPublished: true,
      instructions: [
        'Total Duration: 180 minutes (3 hours).',
        'Total Questions: 180 questions (4 marks each, total 720 marks).',
        'Negative Marking: -1 mark deducted for each incorrect answer.',
        'Section A: Q1-45 (Physics), Section B: Q46-90 (Chemistry), Section C: Q91-135 (Botany), Section D: Q136-180 (Zoology).',
        'Do not switch tabs or minimize the browser window during the examination.'
      ],
      createdBy: teacher ? teacher._id : null,
    });

    console.log(`✅ Created Exam Object: "${exam.title}" (ID: ${exam._id})`);
    console.log('📌 Inserting 180 questions for SET 2 with exact PDF options & answer key mapping...');

    const questionsToInsert = allSet2Questions.map((q) => {
      const correctLetter = rawAnswerKeySet2[q.num] || 'A';
      const correctIndex = mapOptionIndex(correctLetter);

      return {
        examId: exam._id,
        questionNumber: q.num,
        subject: q.subject,
        questionText: `${q.num}. ${q.text}`,
        options: q.opts,
        correctOption: correctIndex,
        marksForCorrect: 4,
        negativeMarksForIncorrect: 1,
        solution: `Correct Answer: Option (${correctLetter}) - ${q.opts[correctIndex]}`,
      };
    });

    await Question.deleteMany({ examId: exam._id });
    const inserted = await Question.insertMany(questionsToInsert);

    exam.totalMarks = inserted.length * 4;
    await exam.save();

    console.log(`🎉 SUCCESS! Seeded ${inserted.length} questions into "${exam.title}" (Total Marks: ${exam.totalMarks}).`);
  } catch (err) {
    console.error('❌ Error seeding NEET Set 2 Test:', err);
  }
};

if (require.main === module) {
  seedNeetSet2Exam().then(() => {
    console.log('🌱 NEET Set 2 Test paper creation complete!');
    process.exit(0);
  });
}

module.exports = seedNeetSet2Exam;
