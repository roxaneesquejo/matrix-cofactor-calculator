export type Step =
  | { type: 'start'; matrix: number[][] }
  | { 
      type: 'expand'; 
      matrix: number[][]; 
      source: 'row' | 'col'; 
      index: number; 
      terms: { sign: number; value: number; minor: number[][] }[] 
    }
  | { type: 'calc_2x2'; matrix: number[][]; result: number }
  | { type: 'sub_calculation'; for: number; result: number }
  | { 
      type: 'final_sum'; 
      terms: { value: number; sign: number; det: number }[]; 
      result: number 
    };

export type MatrixAnalysis = {
  determinant: number;
  steps: Step[];
  isSingular: boolean;
  classification: "SINGULAR" | "NON-SINGULAR";
  message: string;
};

function getMatrixKey(matrix: number[][]): string {
  return matrix.map(row => row.join(',')).join('|');
}

function getMinor(matrix: number[][], rowToRemove: number, colToRemove: number): number[][] {
  return matrix
    .filter((_, rowIndex) => rowIndex !== rowToRemove)
    .map(row => row.filter((_, colIndex) => colIndex !== colToRemove));
}

function getBestExpansion(matrix: number[][]): { type: 'row' | 'col', index: number } {
  const n = matrix.length;
  let maxZeros = -1;
  let bestType: 'row' | 'col' = 'row';
  let bestIndex = 0;

  for (let r = 0; r < n; r++) {
    const zeros = matrix[r].filter(val => val === 0).length;
    if (zeros > maxZeros) {
      maxZeros = zeros;
      bestType = 'row';
      bestIndex = r;
    }
  }

  for (let c = 0; c < n; c++) {
    let zeros = 0;
    for (let r = 0; r < n; r++) {
      if (matrix[r][c] === 0) zeros++;
    }
    if (zeros > maxZeros) {
      maxZeros = zeros;
      bestType = 'col';
      bestIndex = c;
    }
  }

  return { type: bestType, index: bestIndex };
}

export function calculateDeterminant(matrix: number[][]): MatrixAnalysis {
  const n = matrix.length;
  if (n === 0 || matrix.some(row => row.length !== n)) {
    throw new Error("Error: Matrix must be a non-empty square (n x n).");
  }
  
  const allSteps: Step[] = [];
  const memo = new Map<string, number>();

  function shouldRecordSteps(depth: number): boolean {
    if (n <= 5) return true;
    return depth === 0;
  }

  function solve(m: number[][], depth: number): number {
    const matrixKey = getMatrixKey(m);
    
    if (memo.has(matrixKey)) {
      return memo.get(matrixKey)!;
    }

    const record = shouldRecordSteps(depth);

    if (m.length === 1) {
      return m[0][0];
    }

    if (m.length === 2) {
      const result = m[0][0] * m[1][1] - m[0][1] * m[1][0];
      if (record) {
        allSteps.push({ type: 'calc_2x2', matrix: m, result });
      }
      return result;
    }

    let det = 0;
    const expansionTerms: { sign: number, value: number, minor: number[][] }[] = [];
    const finalSumTerms: { value: number; sign: number; det: number }[] = [];
    
    const { type, index } = getBestExpansion(m);

    for (let k = 0; k < m.length; k++) {
      let r, c;
      if (type === 'row') {
        r = index;
        c = k;
      } else {
        r = k;
        c = index;
      }

      const sign = Math.pow(-1, r + c);
      const val = m[r][c];
      const minor = getMinor(m, r, c);
      expansionTerms.push({ sign, value: val, minor });
    }

    if (record) {
      allSteps.push({ 
        type: 'expand', 
        matrix: m, 
        source: type, 
        index: index, 
        terms: expansionTerms 
      });
    }

    for (let k = 0; k < m.length; k++) {
        const term = expansionTerms[k];
        let minorDet = 0;
        
        if (term.value !== 0) {
           minorDet = solve(term.minor, depth + 1);
        } else {
           minorDet = 0; 
        }

        const termTotal = term.sign * term.value * minorDet;
        det += termTotal;
        
        finalSumTerms.push({ value: term.value, sign: term.sign, det: minorDet });
    }
    
    if (record) {
      allSteps.push({ type: 'final_sum', terms: finalSumTerms, result: det });
    }

    memo.set(matrixKey, det);
    return det;
  }
  
  if (shouldRecordSteps(0)) {
      allSteps.push({ type: 'start', matrix });
  }
  
  const determinant = solve(matrix, 0);
  const isSingular = determinant === 0;

  return {
    determinant,
    steps: allSteps,
    isSingular,
    classification: isSingular ? "SINGULAR" : "NON-SINGULAR",
    message: isSingular ? "Note: This matrix does not have an inverse." : "Matrix has an inverse."
  };
}