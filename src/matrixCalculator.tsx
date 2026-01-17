import React, { useState } from 'react';
import { calculateDeterminant, type Step, type MatrixAnalysis } from './matrixlogic';
import './MatrixCalculator.css'; 

const createEmptyMatrix = (size: number): string[][] => {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ''));
};

const getOrdinal = (n: number): string => {
  if (n === undefined || isNaN(n)) return "1st";
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return n + "st";
  if (j === 2 && k !== 12) return n + "nd";
  if (j === 3 && k !== 13) return n + "rd";
  return n + "th";
};

export default function MatrixCalculator() {
  const [size, setSize] = useState<number>(3);
  const [matrix, setMatrix] = useState<string[][]>(createEmptyMatrix(3));
  const [result, setResult] = useState<MatrixAnalysis | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    setSize(newSize);
    setMatrix(createEmptyMatrix(newSize));
    setResult(null);
  };

  const handleMatrixChange = (row: number, col: number, value: string) => {
    const newMatrix = matrix.map((r, i) =>
      i === row ? r.map((c, j) => (j === col ? value : c)) : r
    );
    setMatrix(newMatrix);
  };

  const handleCalculate = () => {
    setIsCalculating(true);
    setResult(null);

    setTimeout(() => {
        const numericMatrix = matrix.map(row =>
            row.map(cell => {
              const val = parseFloat(cell);
              return isNaN(val) ? 0 : val;
            })
          );
      
          try {
            const calculationResult = calculateDeterminant(numericMatrix);
            setResult(calculationResult);
          } catch (error) {
            alert("Error calculating determinant");
          } finally {
            setIsCalculating(false);
          }
    }, 100);
  };

  const renderMiniMatrix = (m: number[][], highlightRow: number = -1, highlightCol: number = -1) => (
    <div className="mini-matrix-wrapper">
      <table className="mini-matrix">
        <tbody>
          {m.map((row, i) => (
            <tr key={i}>
              {row.map((val, j) => {
                const isHighlighted = i === highlightRow || j === highlightCol;
                return (
                  <td key={j} className={`mini-cell ${isHighlighted ? 'highlighted' : ''}`}>
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderStep = (step: Step, index: number) => {
    switch (step.type) {
      case 'start':
        return (
            <div key={index} className="step-container">
               <h3 className="calculator-title">Calculation Setup</h3>
               <div style={{fontSize: '1.1em'}}>
                  <span style={{marginRight: '10px'}}>Finding determinant of:</span>
                  {renderMiniMatrix(step.matrix)}
               </div>
            </div>
        );

      case 'expand':
        const isRow = step.source === 'row';
        const safeIndex = step.index !== undefined ? step.index : 0;
        const ordinalText = getOrdinal(safeIndex + 1);
        
        return (
          <div key={index} className="step-card">
            <h4 className="step-title">Cofactor Expansion Process</h4>

            <div className="sub-step">
                <strong className="sub-step-title">1. Choose a Row or Column</strong>
                <p className="sub-step-desc">
                    Select any row or column to expand along; choosing one with the most zeros simplifies calculations.
                </p>
                <div className="selection-box">
                    {step.matrix && renderMiniMatrix(
                        step.matrix,
                        isRow ? safeIndex : -1,
                        isRow ? -1 : safeIndex
                    )}
                    <p style={{margin: 0}}>
                        We selected the <strong>{ordinalText} {isRow ? 'Row' : 'Column'}</strong>.
                    </p>
                </div>
            </div>

            <div className="sub-step">
                <strong className="sub-step-title">2. Determine the Sign Pattern</strong>
                <p className="sub-step-desc">
                    Use the formula <code style={{background: '#eee', padding: '2px 4px'}}>(-1)<sup>i+j</sup></code> for each element.
                </p>
                <div className="sign-box-container">
                    {step.terms.map((t, i) => (
                        <div key={i} className="sign-box">
                            <strong>{t.value}</strong> &rarr; <strong>{t.sign > 0 ? 'Positive (+)' : 'Negative (-)'}</strong>
                        </div>
                    ))}
                </div>
            </div>

            <div className="sub-step">
                 <strong className="sub-step-title">3. Find the Minor</strong>
                 <p className="sub-step-desc">
                    For each element, "cross out" its row and column to get the minor matrix.
                 </p>
                 <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px'}}>
                    {step.terms.map((t, i) => (
                        <div key={i} style={{textAlign: 'center'}}>
                            {renderMiniMatrix(t.minor)}
                            <div style={{fontSize: '0.85em', marginTop: '5px', color: '#666'}}>Minor for {t.value}</div>
                        </div>
                    ))}
                 </div>
            </div>

            <div>
                <strong className="sub-step-title">4. Calculate the Determinant of the Minor</strong>
                <p className="sub-step-desc">
                    Find the determinant of that smaller submatrix.
                </p>
                <div className="formula-box">
                    <strong style={{color: '#e65100', display: 'block', marginBottom: '10px'}}>Expansion Formula:</strong>
                    
                    <div className="formula-math">
                        <span style={{marginRight: '10px'}}>det(A) = </span>
                        {step.terms.map((t, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <span style={{margin: '0 8px', fontWeight: 'bold'}}>+</span>}
                                <span className="formula-term">
                                    <span style={{fontWeight: 'bold', color: '#d32f2f'}}>{t.sign > 0 ? '' : '-'}{t.value}</span>
                                    <span style={{margin: '0 6px'}}>&times;</span>
                                    <span style={{fontStyle: 'italic', marginRight: '4px'}}>det</span>
                                    {renderMiniMatrix(t.minor)}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        );

      case 'calc_2x2':
        return (
            <div key={index} style={{ marginLeft: '20px', padding: '10px', borderLeft: '2px solid #ddd', marginBottom: '10px', color: '#666' }}>
                <div style={{fontSize: '0.9em'}}>
                    <strong>Sub-step:</strong> Calculating determinant of 2x2 minor:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9em', marginTop: '5px' }}>
                    {renderMiniMatrix(step.matrix)} 
                    <span>= ({step.matrix[0][0]} &times; {step.matrix[1][1]}) - ({step.matrix[0][1]} &times; {step.matrix[1][0]})</span>
                    <span>= <strong>{step.result}</strong></span>
                </div>
            </div>
        );

      case 'sub_calculation':
        return null;

      case 'final_sum':
        return (
          <div key={index} className="final-step-card">
             <strong className="final-title">5. Multiply and Sum the Results</strong>
             <p className="sub-step-desc" style={{marginBottom: '15px'}}>
                Multiply the element by its sign and the determinant of its minor, then sum them up.
             </p>
             
             <div className="term-breakdown-box">
                <strong style={{color: '#555', display: 'block', marginBottom: '15px'}}>Term Breakdown:</strong>
                {step.terms && step.terms.map((t, i) => (
                   <div key={i} className="breakdown-row">
                       <span className="val-color">{t.value}</span> 
                       <span className="label-small"></span>
                       
                       <span className="op-color">&times;</span>

                       <span className="sign-color">{t.sign > 0 ? '+1' : '-1'}</span> 
                       <span className="label-small"></span>
                       
                       <span className="op-color">&times;</span>

                       <span className="det-color">{t.det}</span> 
                       <span className="label-small"></span>

                       <span style={{margin: '0 15px', color: '#333'}}>=</span> 
                       <strong>{t.value * t.sign * t.det}</strong>
                   </div>
                ))}
             </div>

             <div className="final-equation-box">
                 <div style={{marginBottom: '10px'}}>
                    <span style={{color: '#555', fontSize: '0.8em', marginRight: '10px', fontFamily: 'sans-serif'}}>Total:</span>
                    {step.terms && step.terms.map((t, i) => {
                        const termValue = t.value * t.sign * t.det;
                        return (
                            <span key={i}>
                                {i > 0 ? ' + ' : ''}
                                {termValue}
                            </span>
                        );
                    })}
                    {' = '}
                    <strong>{step.result}</strong>
                 </div>
             </div>
             <div style={{fontSize: '0.9em', color: '#555', borderTop: '1px solid #c8e6c9', paddingTop: '10px', marginTop: '10px'}}>
                 This final value is the determinant of the original matrix.
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="calculator-container">
      <h1 className="calculator-title">Cofactor Expansion Calculator</h1>
      <p className="calculator-subtitle">
        A step-by-step determinant calculator using cofactor expansion.
      </p>

      <div className="input-card">
        <div className="controls-container">
            <label className="size-label">Matrix Size: </label>
            <select value={size} onChange={handleSizeChange} className="size-select">
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>{n} x {n}</option>
            ))}
            </select>
        </div>

        <div className="matrix-input-wrapper">
            <div 
                className="matrix-grid"
                style={{ 
                   gridTemplateColumns: `30px repeat(${size}, 60px)` 
                }}
            >
                <div></div>
                {Array.from({length: size}).map((_, j) => (
                    <div key={`head-${j}`} className="grid-header-label">
                        {j + 1}
                    </div>
                ))}

                {matrix.map((row, i) => (
                    <React.Fragment key={`row-${i}`}>
                        <div className="grid-row-label">
                            {i + 1}
                        </div>
                        {row.map((cell, j) => (
                            <input
                            key={`${i}-${j}`}
                            type="number"
                            className="matrix-input"
                            value={cell}
                            onChange={(e) => handleMatrixChange(i, j, e.target.value)}
                            />
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>

        <button 
            onClick={handleCalculate}
            disabled={isCalculating}
            className="calculate-button"
        >
            {isCalculating ? 'Calculating...' : 'Calculate Determinant'}
        </button>
      </div>

      {result && (
        <div className="results-section">
          {result.steps.length > 0 ? result.steps.map(renderStep) : <p>Steps omitted for performance.</p>}
          
          <div className={`result-card ${result.isSingular ? 'singular' : 'non-singular'}`}>
              <h3 className="result-title">Final Answer: {result.determinant}</h3>
              <div className="result-message">
                  {result.message}
              </div>
          </div>
        </div>
      )}
    </div>
  );
}