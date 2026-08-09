const mongoose = require('mongoose');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const connectDB = require('../config/db');
require('dotenv').config();

// Answer Key mapping from PDF Page 18:
// Option A -> 0, B -> 1, C -> 2, D -> 3
const rawAnswerKey = {
  1: 'A', 2: 'A', 3: 'B', 4: 'B', 5: 'B', 6: 'A', 7: 'B', 8: 'A', 9: 'B', 10: 'C',
  11: 'A', 12: 'A', 13: 'B', 14: 'A', 15: 'A', 16: 'B', 17: 'A', 18: 'B', 19: 'A', 20: 'A',
  21: 'B', 22: 'C', 23: 'A', 24: 'B', 25: 'B', 26: 'C', 27: 'B', 28: 'B', 29: 'B', 30: 'A',
  31: 'B', 32: 'B', 33: 'A', 34: 'B', 35: 'B', 36: 'A', 37: 'B', 38: 'C', 39: 'C', 40: 'B',
  41: 'B', 42: 'B', 43: 'B', 44: 'A', 45: 'B', 46: 'B', 47: 'B', 48: 'B', 49: 'B', 50: 'B',
  51: 'B', 52: 'C', 53: 'C', 54: 'B', 55: 'B', 56: 'B', 57: 'B', 58: 'B', 59: 'B', 60: 'A',
  61: 'B', 62: 'C', 63: 'B', 64: 'B', 65: 'B', 66: 'A', 67: 'B', 68: 'B', 69: 'B', 70: 'B',
  71: 'B', 72: 'A', 73: 'B', 74: 'B', 75: 'B', 76: 'B', 77: 'B', 78: 'C', 79: 'A', 80: 'B',
  81: 'A', 82: 'B', 83: 'B', 84: 'B', 85: 'C', 86: 'A', 87: 'B', 88: 'A', 89: 'B', 90: 'B',
  91: 'B', 92: 'B', 93: 'A', 94: 'B', 95: 'B', 96: 'B', 97: 'A', 98: 'B', 99: 'B', 100: 'C',
  101: 'A', 102: 'A', 103: 'B', 104: 'B', 105: 'B', 106: 'B', 107: 'B', 108: 'B', 109: 'C', 110: 'B',
  111: 'B', 112: 'A', 113: 'C', 114: 'C', 115: 'B', 116: 'A', 117: 'B', 118: 'A', 119: 'A', 120: 'B',
  121: 'A', 122: 'A', 123: 'B', 124: 'C', 125: 'B', 126: 'A', 127: 'B', 128: 'B', 129: 'B', 130: 'A',
  131: 'B', 132: 'A', 133: 'B', 134: 'B', 135: 'B', 136: 'B', 137: 'B', 138: 'C', 139: 'A', 140: 'B',
  141: 'B', 142: 'A', 143: 'A', 144: 'A', 145: 'B', 146: 'C', 147: 'A', 148: 'B', 149: 'B', 150: 'B',
  151: 'A', 152: 'B', 153: 'B', 154: 'B', 155: 'B', 156: 'B', 157: 'B', 158: 'B', 159: 'B', 160: 'C',
  161: 'B', 162: 'B', 163: 'A', 164: 'B', 165: 'A', 166: 'A', 167: 'A', 168: 'B', 169: 'B', 170: 'B',
  171: 'B', 172: 'A', 173: 'A', 174: 'B', 175: 'B', 176: 'B', 177: 'B', 178: 'B', 179: 'B', 180: 'B',
  181: 'B'
};

const mapOptionIndex = (letter) => {
  if (letter === 'A') return 0;
  if (letter === 'B') return 1;
  if (letter === 'C') return 2;
  if (letter === 'D') return 3;
  return 0;
};

// All 181 Questions from the PDF
const allPdfQuestions = [
  // SECTION A: PHYSICS (Q1 - Q45)
  { num: 1, subject: 'Physics', text: 'The value of sin 30° + cos 60° is', opts: ['1', '1/2', '3/2', '0'] },
  { num: 2, subject: 'Physics', text: 'If sin θ = 3/5, then cos θ is (θ acute)', opts: ['4/5', '3/4', '5/4', '5/3'] },
  { num: 3, subject: 'Physics', text: 'The value of tan 45° + cot 45° is', opts: ['1', '2', '0', '√2'] },
  { num: 4, subject: 'Physics', text: 'sin²θ + cos²θ is equal to', opts: ['0', '1', '2', 'tan²θ'] },
  { num: 5, subject: 'Physics', text: 'The value of cos 0° is', opts: ['0', '1', '-1', '1/2'] },
  { num: 6, subject: 'Physics', text: 'If θ is small, sin θ (in radians) is approximately equal to', opts: ['θ', 'θ²', '1', '1/θ'] },
  { num: 7, subject: 'Physics', text: 'The value of sin 90° is', opts: ['0', '1', '-1', '1/2'] },
  { num: 8, subject: 'Physics', text: '1 + tan²θ is equal to', opts: ['sec²θ', 'cosec²θ', 'cos²θ', 'sin²θ'] },
  { num: 9, subject: 'Physics', text: 'If x = a sin θ and y = a cos θ, then x² + y² equals', opts: ['a', 'a²', '2a', '0'] },
  { num: 10, subject: 'Physics', text: 'The number of terms in the expansion of (a + b)ⁿ is', opts: ['n', 'n - 1', 'n + 1', '2n'] },
  { num: 11, subject: 'Physics', text: 'The general term in the binomial expansion of (1 + x)ⁿ is', opts: ['ⁿCᵣ xʳ', 'ⁿCᵣ x', 'ⁿPᵣ xʳ', 'r·xʳ'] },
  { num: 12, subject: 'Physics', text: 'For small x, the binomial approximation (1 + x)ⁿ ≈', opts: ['1 + nx', '1 - nx', 'nx', '1 + x'] },
  { num: 13, subject: 'Physics', text: 'The value of (1 - x)⁻¹ for small x is approximately', opts: ['1 - x', '1 + x', '1 - 2x', 'x - 1'] },
  { num: 14, subject: 'Physics', text: 'Using binomial approximation, (1 + 0.01)³ is approximately', opts: ['1.03', '1.003', '1.01', '3.01'] },
  { num: 15, subject: 'Physics', text: 'If a physical quantity is (1 + v²/c²)⁻¹/² and v << c, its approximate value is', opts: ['1 - v²/2c²', '1 + v²/2c²', '1 - v²/c²', '1'] },
  { num: 16, subject: 'Physics', text: 'The nth term of an arithmetic progression with first term a and common difference d is', opts: ['a + nd', 'a + (n-1)d', 'a - (n-1)d', 'nd'] },
  { num: 17, subject: 'Physics', text: 'Sum of first n natural numbers is', opts: ['n(n+1)/2', 'n(n-1)/2', 'n²', 'n(n+1)'] },
  { num: 18, subject: 'Physics', text: 'If a, a+d, a+2d,... are in AP, the common difference is obtained by', opts: ['dividing consecutive terms', 'subtracting consecutive terms', 'adding consecutive terms', 'multiplying terms'] },
  { num: 19, subject: 'Physics', text: 'The sum of n terms of an AP is Sₙ = n/2 [2a + (n-1)d]. If a = 2, d = 3, n = 5, Sₙ is', opts: ['40', '35', '50', '45'] },
  { num: 20, subject: 'Physics', text: 'In an AP, if the first term is 5 and the 10th term is 32, the common difference is', opts: ['3', '2', '27/9', '27'] },
  { num: 21, subject: 'Physics', text: 'Three numbers in AP have sum 15. The middle term is', opts: ['3', '5', '7', '15'] },
  { num: 22, subject: 'Physics', text: 'The nth term of a geometric progression with first term a and common ratio r is', opts: ['a + (n-1)r', 'arⁿ', 'ar^(n-1)', 'a/r^(n-1)'] },
  { num: 23, subject: 'Physics', text: 'Sum of infinite GP with |r| < 1 is', opts: ['a/(1-r)', 'a(1-r)', 'a/(1+r)', 'ar/(1-r)'] },
  { num: 24, subject: 'Physics', text: 'In the GP 2, 4, 8, 16,..., the common ratio is', opts: ['1', '2', '4', '8'] },
  { num: 25, subject: 'Physics', text: 'The sum to infinity of the series 1 + 1/2 + 1/4 + 1/8 + ... is', opts: ['1', '2', '3', '4'] },
  { num: 26, subject: 'Physics', text: 'If a, ar, ar² are in GP with a = 3, r = 2, the third term is', opts: ['6', '9', '12', '18'] },
  { num: 27, subject: 'Physics', text: 'The slope of a straight line graph y = mx + c represents', opts: ['the y-intercept', 'the rate of change of y with x', 'the x-intercept', 'the area under the line'] },
  { num: 28, subject: 'Physics', text: 'For a velocity-time graph, the slope of the line gives', opts: ['displacement', 'acceleration', 'velocity', 'distance'] },
  { num: 29, subject: 'Physics', text: 'The area under a velocity-time graph gives', opts: ['acceleration', 'displacement', 'force', 'momentum'] },
  { num: 30, subject: 'Physics', text: 'A straight line graph passing through the origin represents', opts: ['direct proportionality', 'inverse proportionality', 'no relation', 'constant value'] },
  { num: 31, subject: 'Physics', text: 'If y is inversely proportional to x, the graph of y versus 1/x is', opts: ['a parabola', 'a straight line through origin', 'a hyperbola', 'a circle'] },
  { num: 32, subject: 'Physics', text: 'The graph of y = x² is a', opts: ['straight line', 'parabola', 'hyperbola', 'circle'] },
  { num: 33, subject: 'Physics', text: 'log(ab) is equal to', opts: ['log a + log b', 'log a - log b', 'log a × log b', 'log a / log b'] },
  { num: 34, subject: 'Physics', text: 'log(a/b) is equal to', opts: ['log a + log b', 'log a - log b', 'log a × log b', 'b log a'] },
  { num: 35, subject: 'Physics', text: 'log(aⁿ) is equal to', opts: ['n + log a', 'n log a', 'log a / n', 'a log n'] },
  { num: 36, subject: 'Physics', text: 'The value of log 1 (any base) is', opts: ['0', '1', '10', 'undefined'] },
  { num: 37, subject: 'Physics', text: 'The value of log_a a is', opts: ['0', '1', 'a', 'undefined'] },
  { num: 38, subject: 'Physics', text: 'If log₁₀ 2 = 0.301, then log₁₀ 8 equals approximately', opts: ['0.301', '0.602', '0.903', '1.204'] },
  { num: 39, subject: 'Physics', text: 'Natural logarithm uses base', opts: ['10', '2', 'e', '1'] },
  { num: 40, subject: 'Physics', text: 'The derivative of xⁿ with respect to x is', opts: ['nxⁿ', 'nx^(n-1)', 'x^(n-1)', 'n·x'] },
  { num: 41, subject: 'Physics', text: 'The derivative of a constant is', opts: ['1', '0', 'the constant itself', 'infinity'] },
  { num: 42, subject: 'Physics', text: 'The integral of xⁿ dx (n ≠ -1) is', opts: ['xⁿ⁺¹ + C', 'xⁿ⁺¹/(n+1) + C', 'nxⁿ⁻¹ + C', 'xⁿ/n + C'] },
  { num: 43, subject: 'Physics', text: 'If displacement x = t², velocity dx/dt at t = 3 s is', opts: ['3', '6', '9', '2'] },
  { num: 44, subject: 'Physics', text: 'The derivative of sin θ with respect to θ is', opts: ['cos θ', '-cos θ', 'sin θ', '-sin θ'] },
  { num: 45, subject: 'Physics', text: 'The derivative of cos θ with respect to θ is', opts: ['sin θ', '-sin θ', 'cos θ', '-cos θ'] },

  // SECTION B: CHEMISTRY (Q46 - Q90)
  { num: 46, subject: 'Chemistry', text: "Dalton's atomic theory proposed that atoms of the same element are", opts: ['different in mass and properties', 'identical in mass and properties', 'always radioactive', 'divisible into smaller parts'] },
  { num: 47, subject: 'Chemistry', text: "According to Dalton's atomic theory, atoms combine in", opts: ['random ratios', 'simple whole number ratios', 'fractional ratios only', 'no fixed ratio'] },
  { num: 48, subject: 'Chemistry', text: "Dalton's atomic theory failed to explain the existence of", opts: ['molecules', 'isotopes and isobars', 'compounds', 'elements'] },
  { num: 49, subject: 'Chemistry', text: 'Which law states that matter can neither be created nor destroyed in a chemical reaction?', opts: ['Law of definite proportions', 'Law of conservation of mass', 'Law of multiple proportions', "Gay-Lussac's law"] },
  { num: 50, subject: 'Chemistry', text: 'The law of definite proportions was given by', opts: ['Dalton', 'Proust', 'Avogadro', 'Gay-Lussac'] },
  { num: 51, subject: 'Chemistry', text: 'An electron carries a charge of approximately', opts: ['+1.6 × 10⁻¹⁹ C', '-1.6 × 10⁻¹⁹ C', '0 C', '-1.6 × 10⁻¹⁶ C'] },
  { num: 52, subject: 'Chemistry', text: 'The mass of a proton is approximately', opts: ['1/1837 times that of an electron', 'equal to that of an electron', '1837 times that of an electron', 'equal to that of a neutron only'] },
  { num: 53, subject: 'Chemistry', text: 'A neutron carries a charge of', opts: ['+1', '-1', '0', '+2'] },
  { num: 54, subject: 'Chemistry', text: 'The number of protons in an atom is called its', opts: ['mass number', 'atomic number', 'atomic mass', 'valency'] },
  { num: 55, subject: 'Chemistry', text: 'The mass number of an atom is the sum of', opts: ['protons and electrons', 'protons and neutrons', 'neutrons and electrons', 'protons only'] },
  { num: 56, subject: 'Chemistry', text: 'One atomic mass unit (amu) is defined as', opts: ['mass of one hydrogen atom', '1/12th the mass of a carbon-12 atom', 'mass of one electron', 'mass of one oxygen atom'] },
  { num: 57, subject: 'Chemistry', text: 'The molar mass of water (H₂O) is', opts: ['16 g/mol', '18 g/mol', '20 g/mol', '17 g/mol'] },
  { num: 58, subject: 'Chemistry', text: 'One mole of any substance contains how many particles?', opts: ['6.022 × 10²²', '6.022 × 10²³', '6.022 × 10²⁴', '1.6 × 10⁻¹⁹'] },
  { num: 59, subject: 'Chemistry', text: "Avogadro's number is also called the", opts: ['molar mass', 'Avogadro constant', 'atomic mass', 'gram molecular mass'] },
  { num: 60, subject: 'Chemistry', text: 'The molar mass of CO₂ is', opts: ['44 g/mol', '28 g/mol', '32 g/mol', '40 g/mol'] },
  { num: 61, subject: 'Chemistry', text: 'The number of moles in 44 g of CO₂ (molar mass 44 g/mol) is', opts: ['0.5', '1', '2', '4'] },
  { num: 62, subject: 'Chemistry', text: 'The number of atoms in 1 mole of oxygen atoms is', opts: ['6.022 × 10²²', '3.011 × 10²³', '6.022 × 10²³', '1.204 × 10²⁴'] },
  { num: 63, subject: 'Chemistry', text: 'The average molar mass of a mixture is calculated using', opts: ['simple average of molar masses', 'weighted average based on mole fraction', 'sum of molar masses', 'difference of molar masses'] },
  { num: 64, subject: 'Chemistry', text: 'Vapour density is defined as the ratio of the mass of a given volume of gas to the mass of an equal volume of', opts: ['oxygen', 'hydrogen', 'nitrogen', 'air'] },
  { num: 65, subject: 'Chemistry', text: 'The relationship between molar mass (M) and vapour density (VD) is', opts: ['M = VD', 'M = 2 × VD', 'M = VD/2', 'M = VD²'] },
  { num: 66, subject: 'Chemistry', text: 'Mass percentage of a component in a mixture is given by', opts: ['(mass of component/total mass) × 100', '(total mass/mass of component) × 100', 'mass of component × 100', 'mass of component/100'] },
  { num: 67, subject: 'Chemistry', text: 'A compound contains 40% carbon, 6.7% hydrogen, and 53.3% oxygen by mass. This data helps determine its', opts: ['molecular formula only', 'empirical formula', 'structural formula', 'Lewis structure'] },
  { num: 68, subject: 'Chemistry', text: 'Stoichiometry deals with', opts: ['the shapes of molecules', 'quantitative relationships in chemical reactions', 'the physical states of matter', 'the color of compounds'] },
  { num: 69, subject: 'Chemistry', text: 'The limiting reagent in a reaction is the reactant that', opts: ['is present in excess', 'gets completely consumed first', 'does not react', 'is a catalyst'] },
  { num: 70, subject: 'Chemistry', text: 'If 2 mol of H₂ reacts with 1 mol of O₂ to form water, and only 1.5 mol H₂ is available with excess O₂, the limiting reagent is', opts: ['O₂', 'H₂', 'H₂O', 'none'] },
  { num: 71, subject: 'Chemistry', text: 'Theoretical yield refers to', opts: ['the actual amount of product obtained', 'the maximum amount of product possible from given reactants', 'the amount of reactant left over', 'the amount of catalyst used'] },
  { num: 72, subject: 'Chemistry', text: 'Percentage yield is calculated as', opts: ['(actual yield/theoretical yield) × 100', '(theoretical yield/actual yield) × 100', 'actual yield - theoretical yield', 'actual yield + theoretical yield'] },
  { num: 73, subject: 'Chemistry', text: 'An impure sample of a substance contains additional non-reactive material called', opts: ['reagent', 'impurity', 'catalyst', 'solvent'] },
  { num: 74, subject: 'Chemistry', text: 'The law of multiple proportions applies when two elements combine to form', opts: ['only one compound', 'two or more compounds', 'no compound', 'an alloy'] },
  { num: 75, subject: 'Chemistry', text: 'The law of multiple proportions was proposed by', opts: ['Proust', 'Dalton', 'Avogadro', 'Richter'] },
  { num: 76, subject: 'Chemistry', text: "Gay-Lussac's law of gaseous volumes relates to", opts: ['masses of reacting gases', 'volumes of reacting gases at same T and P', 'densities of gases', 'boiling points of gases'] },
  { num: 77, subject: 'Chemistry', text: "Avogadro's law states that equal volumes of gases at the same temperature and pressure contain", opts: ['equal masses', 'equal number of molecules', 'equal densities', 'equal moles of atoms only'] },
  { num: 78, subject: 'Chemistry', text: 'The law of reciprocal proportions relates the combining ratios of elements that combine with a', opts: ['different third element in different compounds', 'fixed third element', 'same third element', 'no third element'] },
  { num: 79, subject: 'Chemistry', text: 'An equivalent mass of an element is the mass that combines with or displaces', opts: ['1 g of hydrogen', '1 mole of hydrogen', '1 g of oxygen only', '1 g of any element'] },
  { num: 80, subject: 'Chemistry', text: 'The equivalent mass of an acid is molar mass divided by its', opts: ['molarity', 'basicity (number of replaceable H⁺)', 'acidity constant', 'molar volume'] },
  { num: 81, subject: 'Chemistry', text: 'The equivalent mass of a base is molar mass divided by its', opts: ['acidity (number of replaceable OH⁻)', 'basicity', 'molarity', 'normality'] },
  { num: 82, subject: 'Chemistry', text: 'Normality of a solution is defined as', opts: ['moles of solute per litre of solution', 'gram equivalents of solute per litre of solution', 'moles of solute per kg of solvent', 'mass of solute per litre'] },
  { num: 83, subject: 'Chemistry', text: 'The relationship between normality (N) and molarity (M) is', opts: ['N = M', 'N = M × n-factor', 'N = M/n-factor', 'N = M + n-factor'] },
  { num: 84, subject: 'Chemistry', text: '1 M H₂SO₄ solution has a normality of', opts: ['1 N', '2 N', '0.5 N', '4 N'] },
  { num: 85, subject: 'Chemistry', text: 'The n-factor of KMnO₄ in acidic medium is', opts: ['1', '3', '5', '7'] },
  { num: 86, subject: 'Chemistry', text: 'Molarity is defined as', opts: ['moles of solute per litre of solution', 'moles of solute per kg of solvent', 'mass of solute per litre', 'gram equivalents per litre'] },
  { num: 87, subject: 'Chemistry', text: 'Molality is defined as', opts: ['moles of solute per litre of solution', 'moles of solute per kg of solvent', 'gram equivalents per litre', 'mass percentage of solute'] },
  { num: 88, subject: 'Chemistry', text: 'Mole fraction of a component is the ratio of', opts: ['moles of component to total moles', 'mass of component to total mass', 'volume of component to total volume', 'moles of component to volume of solution'] },
  { num: 89, subject: 'Chemistry', text: 'The empirical formula of a compound represents', opts: ['the exact number of atoms in a molecule', 'the simplest whole-number ratio of atoms', 'the molecular mass only', 'the structural arrangement of atoms'] },
  { num: 90, subject: 'Chemistry', text: 'If the empirical formula mass is 30 and the molecular mass is 60, the molecular formula is obtained by multiplying the empirical formula by', opts: ['1', '2', '3', '4'] },

  // SECTION C: BOTANY (Q91 - Q135)
  { num: 91, subject: 'Botany', text: 'The cell was first discovered and named by', opts: ['Robert Brown', 'Robert Hooke', 'Schleiden', 'Schwann'] },
  { num: 92, subject: 'Botany', text: 'Robert Hooke observed cells in a thin slice of', opts: ['onion peel', 'cork', 'human cheek', 'potato'] },
  { num: 93, subject: 'Botany', text: 'Robert Hooke published his observations of cells in the year', opts: ['1665', '1595', '1839', '1855'] },
  { num: 94, subject: 'Botany', text: 'The living cell was first observed by', opts: ['Robert Hooke', 'Anton van Leeuwenhoek', 'Rudolf Virchow', 'Robert Brown'] },
  { num: 95, subject: 'Botany', text: 'Leeuwenhoek is credited with the discovery of', opts: ['the nucleus', 'free-living cells in pond water', 'cell theory', 'the cell wall'] },
  { num: 96, subject: 'Botany', text: 'The simple microscope differs from a compound microscope in that it uses', opts: ['two lenses', 'a single lens', 'no lens', 'an electron beam'] },
  { num: 97, subject: 'Botany', text: 'The resolving power of a light microscope is limited by the', opts: ['wavelength of visible light', 'size of the specimen', 'thickness of the glass slide', 'type of stain used'] },
  { num: 98, subject: 'Botany', text: 'An electron microscope uses a beam of', opts: ['light', 'electrons', 'X-rays', 'protons'] },
  { num: 99, subject: 'Botany', text: 'Electron microscopes provide higher resolution than light microscopes because electrons have', opts: ['longer wavelength', 'shorter wavelength', 'no wavelength', 'the same wavelength as light'] },
  { num: 100, subject: 'Botany', text: 'Which type of microscope is best suited to study the internal ultrastructure of an organelle?', opts: ['Simple microscope', 'Compound light microscope', 'Electron microscope', 'Magnifying glass'] },
  { num: 101, subject: 'Botany', text: 'The cell theory was proposed by', opts: ['Schleiden and Schwann', 'Hooke and Brown', 'Watson and Crick', 'Darwin and Wallace'] },
  { num: 102, subject: 'Botany', text: 'Matthias Schleiden, a botanist, studied plant cells and concluded in 1838 that', opts: ['all plants are made of cells', 'animals are made of cells', 'cells arise spontaneously', 'cells lack a nucleus'] },
  { num: 103, subject: 'Botany', text: 'Theodor Schwann extended the cell theory in 1839 by proposing that', opts: ['only plants are made of cells', 'both plants and animals are composed of cells', 'cells cannot divide', 'cells lack a cell membrane'] },
  { num: 104, subject: 'Botany', text: "The statement 'omnis cellula-e cellula' (all cells arise from pre-existing cells) was given by", opts: ['Robert Hooke', 'Rudolf Virchow', 'Robert Brown', 'Anton van Leeuwenhoek'] },
  { num: 105, subject: 'Botany', text: 'According to modern cell theory, the cell is the basic unit of', opts: ['reproduction only', 'structure, function, and organisation in living organisms', 'energy production only', 'genetic mutation only'] },
  { num: 106, subject: 'Botany', text: 'The cell is considered the fundamental unit of life because it is the smallest unit capable of', opts: ['photosynthesis only', 'independent existence and performing life functions', 'respiration only', 'movement only'] },
  { num: 107, subject: 'Botany', text: 'Which of the following is the smallest known cell?', opts: ['Bacterium', 'Mycoplasma', 'Amoeba', 'Ostrich egg'] },
  { num: 108, subject: 'Botany', text: 'The largest isolated single cell known is', opts: ['a bacterium', 'an egg of ostrich', 'Amoeba', 'Paramecium'] },
  { num: 109, subject: 'Botany', text: 'Cells vary greatly in shape which can be', opts: ['only spherical', 'only rod-shaped', 'spherical, elongated, or irregular depending on function', 'always cuboidal'] },
  { num: 110, subject: 'Botany', text: 'A cell that lacks a well-organized nucleus enclosed by a nuclear membrane is called', opts: ['eukaryotic', 'prokaryotic', 'multicellular', 'diploid'] },
  { num: 111, subject: 'Botany', text: 'A cell possessing a true, membrane-bound nucleus is termed', opts: ['prokaryotic', 'eukaryotic', 'acellular', 'anucleate'] },
  { num: 112, subject: 'Botany', text: 'Examples of prokaryotic organisms include', opts: ['bacteria and cyanobacteria', 'fungi and plants', 'animals only', 'protozoa only'] },
  { num: 113, subject: 'Botany', text: 'Examples of eukaryotic organisms include', opts: ['bacteria only', 'cyanobacteria only', 'protists, fungi, plants and animals', 'viruses only'] },
  { num: 114, subject: 'Botany', text: 'In a prokaryotic cell, the genetic material lies in a region called the', opts: ['nucleus', 'nucleolus', 'nucleoid', 'chromatin'] },
  { num: 115, subject: 'Botany', text: 'The cell wall of most bacteria is composed mainly of', opts: ['cellulose', 'peptidoglycan (murein)', 'chitin', 'lignin'] },
  { num: 116, subject: 'Botany', text: 'The jelly-like outer covering surrounding the cell wall in some bacteria is called', opts: ['capsule', 'flagellum', 'mesosome', 'pilus'] },
  { num: 117, subject: 'Botany', text: 'Mesosomes in bacterial cells are formed by extensions of the', opts: ['nuclear membrane', 'plasma membrane', 'cell wall', 'ribosome'] },
  { num: 118, subject: 'Botany', text: 'Mesosomes primarily help in', opts: ['cell wall formation, DNA replication and respiration', 'photosynthesis only', 'protein synthesis only', 'excretion only'] },
  { num: 119, subject: 'Botany', text: 'In photosynthetic prokaryotes such as cyanobacteria, chlorophyll is located on membranous vesicles called', opts: ['chromatophores', 'chloroplasts', 'mitochondria', 'vacuoles'] },
  { num: 120, subject: 'Botany', text: 'Ribosomes in a prokaryotic cell are of which type?', opts: ['80S', '70S', '60S', '40S'] },
  { num: 121, subject: 'Botany', text: 'Bacterial ribosomes are associated with the plasma membrane and are used for', opts: ['protein synthesis', 'respiration', 'photosynthesis', 'excretion'] },
  { num: 122, subject: 'Botany', text: 'Small circular extra-chromosomal DNA found in bacteria are called', opts: ['plasmids', 'plastids', 'ribosomes', 'vacuoles'] },
  { num: 123, subject: 'Botany', text: 'Plasmids are significant in biotechnology because they', opts: ['cause disease', 'confer special phenotypic traits and are used as vectors', 'produce toxins only', 'form the cell wall'] },
  { num: 124, subject: 'Botany', text: 'Thread-like appendages used by bacteria for locomotion are called', opts: ['pili', 'fimbriae', 'flagella', 'cilia'] },
  { num: 125, subject: 'Botany', text: 'Fimbriae and pili in bacteria mainly help in', opts: ['locomotion', 'attachment to surfaces and conjugation', 'photosynthesis', 'respiration'] },
  { num: 126, subject: 'Botany', text: 'The cell envelope of a bacterial cell typically consists of', opts: ['glycocalyx, cell wall and plasma membrane', 'nucleus and cytoplasm only', 'mitochondria and ribosomes', 'chloroplast and vacuole'] },
  { num: 127, subject: 'Botany', text: 'In eukaryotic cells, the genetic material is enclosed within a', opts: ['nucleoid', 'nuclear membrane', 'cell wall', 'cell membrane only'] },
  { num: 128, subject: 'Botany', text: 'The membrane-bound organelle responsible for aerobic respiration in eukaryotic cells is the', opts: ['chloroplast', 'mitochondrion', 'ribosome', 'lysosome'] },
  { num: 129, subject: 'Botany', text: 'Photosynthesis in eukaryotic plant cells occurs in the', opts: ['mitochondria', 'chloroplast', 'Golgi body', 'peroxisome'] },
  { num: 130, subject: 'Botany', text: 'The organelle responsible for packaging and modifying proteins for secretion is the', opts: ['Golgi apparatus', 'lysosome', 'ribosome', 'vacuole'] },
  { num: 131, subject: 'Botany', text: 'Ribosomes in eukaryotic cytoplasm are of which type?', opts: ['70S', '80S', '60S alone', '40S alone'] },
  { num: 132, subject: 'Botany', text: 'The organelle containing hydrolytic enzymes for intracellular digestion is the', opts: ['lysosome', 'peroxisome', 'mitochondrion', 'ribosome'] },
  { num: 133, subject: 'Botany', text: 'Which organelle is the site of synthesis of lipids and steroids in eukaryotic cells?', opts: ['Rough endoplasmic reticulum', 'Smooth endoplasmic reticulum', 'Golgi apparatus', 'Ribosome'] },
  { num: 134, subject: 'Botany', text: 'The endoplasmic reticulum studded with ribosomes on its surface is called the', opts: ['smooth ER', 'rough ER', 'agranular ER', 'sarcoplasmic reticulum'] },
  { num: 135, subject: 'Botany', text: 'Which structure controls the entry and exit of materials into and out of a eukaryotic cell?', opts: ['Cell wall', 'Plasma membrane', 'Nucleolus', 'Cytoskeleton'] },

  // SECTION D: ZOOLOGY (Q136 - Q181)
  { num: 136, subject: 'Zoology', text: 'A tissue is defined as a group of cells that are', opts: ['different in origin and function', 'similar in structure and perform a common function', 'always non-living', 'found only in plants'] },
  { num: 137, subject: 'Zoology', text: 'The study of tissues is called', opts: ['cytology', 'histology', 'anatomy', 'physiology'] },
  { num: 138, subject: 'Zoology', text: 'Animal tissues are broadly classified into how many main types?', opts: ['Two', 'Three', 'Four', 'Five'] },
  { num: 139, subject: 'Zoology', text: 'The four main types of animal tissues are', opts: ['epithelial, connective, muscular and nervous', 'epidermal, ground, vascular and meristematic', 'simple, compound, complex and permanent', 'areolar, adipose, bone and blood'] },
  { num: 140, subject: 'Zoology', text: 'Which tissue covers the body surface and lines body cavities?', opts: ['Connective tissue', 'Epithelial tissue', 'Muscular tissue', 'Nervous tissue'] },
  { num: 141, subject: 'Zoology', text: 'Epithelial tissue is characterized by cells that are', opts: ['loosely packed with abundant matrix', 'tightly packed with little intercellular matrix', 'excitable and contractile', 'always dead'] },
  { num: 142, subject: 'Zoology', text: 'Epithelial tissue rests on a', opts: ['basement membrane', 'matrix of collagen fibers', 'layer of blood vessels', 'layer of adipose cells'] },
  { num: 143, subject: 'Zoology', text: 'Simple squamous epithelium consists of cells that are', opts: ['flat and thin', 'cube-shaped', 'tall and column-shaped', 'ciliated and mucus-secreting'] },
  { num: 144, subject: 'Zoology', text: 'Simple squamous epithelium is found lining the', opts: ['walls of blood vessels and air sacs of lungs', 'stomach lining', 'sweat gland ducts', 'skin surface'] },
  { num: 145, subject: 'Zoology', text: 'Cuboidal epithelium is commonly found in', opts: ['blood vessel lining', 'kidney tubules and salivary gland ducts', 'lining of intestine', 'lining of trachea'] },
  { num: 146, subject: 'Zoology', text: 'Columnar epithelium consists of cells that are', opts: ['flat and scale-like', 'cube-shaped', 'tall, slender, column-like', 'irregularly shaped'] },
  { num: 147, subject: 'Zoology', text: 'Columnar epithelium with cilia on its free surface is called', opts: ['ciliated columnar epithelium', 'squamous epithelium', 'cuboidal epithelium', 'glandular epithelium'] },
  { num: 148, subject: 'Zoology', text: 'Ciliated epithelium helps in', opts: ['secretion of hormones', 'moving particles or mucus in a specific direction', 'contraction of muscles', 'transmission of nerve impulses'] },
  { num: 149, subject: 'Zoology', text: 'Epithelium made of a single layer of cells is termed', opts: ['stratified epithelium', 'simple epithelium', 'compound epithelium', 'transitional epithelium'] },
  { num: 150, subject: 'Zoology', text: 'Epithelium made of multiple layers of cells, providing protection, is termed', opts: ['simple epithelium', 'stratified/compound epithelium', 'glandular epithelium', 'squamous epithelium only'] },
  { num: 151, subject: 'Zoology', text: 'Stratified squamous epithelium is found in the', opts: ['skin epidermis', 'kidney tubules', 'blood vessels', 'alveoli'] },
  { num: 152, subject: 'Zoology', text: 'Transitional epithelium, capable of stretching, is found in the', opts: ['stomach', 'urinary bladder', 'small intestine', 'lungs'] },
  { num: 153, subject: 'Zoology', text: 'Glandular epithelium is specialized for', opts: ['absorption only', 'secretion', 'protection only', 'sensation only'] },
  { num: 154, subject: 'Zoology', text: 'Unicellular glands, such as goblet cells, secrete', opts: ['hormones', 'mucus', 'enzymes only', 'sweat'] },
  { num: 155, subject: 'Zoology', text: 'Exocrine glands release their secretions', opts: ['directly into the blood', 'through ducts onto an epithelial surface', 'into the nucleus', 'into lymph nodes only'] },
  { num: 156, subject: 'Zoology', text: 'Endocrine glands release their secretions', opts: ['through ducts', 'directly into the blood without ducts', 'onto the skin surface', 'into the digestive tract via ducts'] },
  { num: 157, subject: 'Zoology', text: 'Cell junctions that hold epithelial cells tightly together and prevent leakage are called', opts: ['gap junctions', 'tight junctions', 'adhering junctions', 'desmosomes only'] },
  { num: 158, subject: 'Zoology', text: 'Adhering junctions primarily function to', opts: ['allow movement of ions between cells', 'keep cells performing a synchronous function bound together', 'prevent all molecular movement', 'form blood vessels'] },
  { num: 159, subject: 'Zoology', text: 'Gap junctions facilitate', opts: ['mechanical strength only', 'communication between adjacent cells via ion/molecule diffusion', 'cell death', 'attachment to basement membrane only'] },
  { num: 160, subject: 'Zoology', text: 'Which junction type forms a communicating channel linking the cytoplasm of adjoining cells?', opts: ['Tight junction', 'Adhering junction', 'Gap junction', 'Desmosome'] },
  { num: 161, subject: 'Zoology', text: 'Desmosomes are a type of', opts: ['tight junction', 'adhering junction', 'gap junction', 'nervous junction'] },
  { num: 162, subject: 'Zoology', text: 'Connective tissue is characterized by cells that are', opts: ['tightly packed with no matrix', 'loosely spaced in an extracellular matrix', 'always excitable', 'arranged in sheets only'] },
  { num: 163, subject: 'Zoology', text: 'The matrix of connective tissue may be', opts: ['jelly-like, fluid, dense or rigid', 'always solid bone', 'always liquid', 'absent entirely'] },
  { num: 164, subject: 'Zoology', text: 'Which connective tissue has cells embedded in a fluid matrix called plasma?', opts: ['Areolar tissue', 'Blood', 'Cartilage', 'Bone'] },
  { num: 165, subject: 'Zoology', text: 'Blood plasma mainly transports', opts: ['gases, digested food, hormones and waste materials', 'only oxygen', 'only carbon dioxide', 'only hormones'] },
  { num: 166, subject: 'Zoology', text: 'Which of the following is a loose connective tissue found between the skin and muscles?', opts: ['Areolar tissue', 'Cartilage', 'Bone', 'Tendon'] },
  { num: 167, subject: 'Zoology', text: 'Adipose tissue is specialized for', opts: ['fat storage', 'protein synthesis', 'gas exchange', 'nerve conduction'] },
  { num: 168, subject: 'Zoology', text: 'Adipose tissue is located mainly', opts: ['in the brain', 'below the skin', 'in the lungs', 'in the liver only'] },
  { num: 169, subject: 'Zoology', text: 'Dense regular connective tissue that attaches muscle to bone is called', opts: ['ligament', 'tendon', 'cartilage', 'areolar tissue'] },
  { num: 170, subject: 'Zoology', text: 'Dense regular connective tissue that connects one bone to another is called', opts: ['tendon', 'ligament', 'cartilage', 'areolar tissue'] },
  { num: 171, subject: 'Zoology', text: 'Cartilage matrix is solid and pliable, secreted by cells called', opts: ['osteocytes', 'chondrocytes', 'fibroblasts', 'erythrocytes'] },
  { num: 172, subject: 'Zoology', text: 'Cartilage is commonly found in the', opts: ['nose, ear, trachea and larynx', 'liver only', 'heart only', 'kidney only'] },
  { num: 173, subject: 'Zoology', text: 'Bone, a specialized connective tissue, has a matrix rich in', opts: ['calcium salts and collagen fibers', 'fat only', 'keratin only', 'chitin only'] },
  { num: 174, subject: 'Zoology', text: 'The hard matrix of bone makes it suitable for', opts: ['gas exchange', 'structural support of the body', 'hormone secretion', 'digestion'] },
  { num: 175, subject: 'Zoology', text: 'Skeletal connective tissues, cartilage and bone, are collectively grouped as', opts: ['fluid connective tissue', 'supportive/skeletal connective tissue', 'loose connective tissue', 'vascular tissue'] },
  { num: 176, subject: 'Zoology', text: 'Muscular tissue is composed of elongated cells called', opts: ['neurons', 'muscle fibers', 'osteocytes', 'chondrocytes'] },
  { num: 177, subject: 'Zoology', text: 'Muscle tissue is responsible for', opts: ['secretion', 'movement of the body', 'transmission of impulses', 'protection only'] },
  { num: 178, subject: 'Zoology', text: 'Which muscle type is voluntary and shows alternate light and dark bands (striations)?', opts: ['Smooth muscle', 'Skeletal (striated) muscle', 'Cardiac muscle', 'Areolar muscle'] },
  { num: 179, subject: 'Zoology', text: 'Smooth muscle, found in the walls of internal organs, is', opts: ['voluntary and striated', 'involuntary and unstriated', 'voluntary and unstriated', 'involuntary and striated'] },
  { num: 180, subject: 'Zoology', text: 'Cardiac muscle, found only in the heart, is', opts: ['voluntary and striated', 'involuntary and striated', 'involuntary and unstriated', 'voluntary and unstriated'] },
  { num: 181, subject: 'Zoology', text: 'The basic structural and functional unit of nervous tissue is the', opts: ['osteocyte', 'neuron', 'myocyte', 'chondrocyte'] }
];

const seedNeetExam = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    // Ensure teacher user exists
    let teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      teacher = await User.findOne({});
    }

    console.log('📝 Creating NEET PRACTICE TEST Exam...');

    // Delete previous version if exists to avoid duplication
    await Exam.deleteMany({ title: /NEET PRACTICE TEST/i });

    const exam = await Exam.create({
      title: 'NEET PRACTICE TEST - Physics, Chemistry, Botany & Zoology',
      description: 'Official 180-Question NEET Practice Entrance Exam covering Physics (Basic Maths & Calculus), Chemistry (Basic Concepts), Botany (Cell: Unit of Life), and Zoology (Structural Organization).',
      bookletCode: 'NEET-PRACTICE-TEST-2026',
      subject: 'Physics, Chemistry, Botany, Zoology',
      durationMinutes: 180,
      defaultMarksPerQuestion: 4,
      defaultNegativeMarks: 1,
      isPublished: true,
      instructions: [
        'Total Duration: 180 minutes (3 hours).',
        'Total Questions: 181 questions (4 marks each, total 724 marks).',
        'Negative Marking: -1 mark deducted for each incorrect answer.',
        'Section A: Q1-45 (Physics), Section B: Q46-90 (Chemistry), Section C: Q91-135 (Botany), Section D: Q136-181 (Zoology).',
        'Do not switch tabs or minimize the browser window during the live examination.'
      ],
      createdBy: teacher ? teacher._id : null,
    });

    console.log(`✅ Created Exam Object: "${exam.title}" (ID: ${exam._id})`);
    console.log('📌 Inserting 181 questions with exact PDF options & answer key mapping...');

    const questionsToInsert = allPdfQuestions.map((q) => {
      const correctLetter = rawAnswerKey[q.num] || 'A';
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
    console.error('❌ Error seeding NEET Practice Test:', err);
  }
};

if (require.main === module) {
  seedNeetExam().then(() => {
    console.log('🌱 NEET Test paper creation complete!');
    process.exit(0);
  });
}

module.exports = seedNeetExam;
