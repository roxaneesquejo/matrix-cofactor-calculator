import React, { useState } from 'react';
import { calculateDeterminant, type Step, type MatrixAnalysis } from './matrixlogic';

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
    <div style={{ display: 'inline-block', verticalAlign: 'middle', margin: '5px' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: '0.85em', background: 'white', border: '1px solid #333' }}>
        <tbody>
          {m.map((row, i) => (
            <tr key={i}>
              {row.map((val, j) => {
                const isHighlighted = i === highlightRow || j === highlightCol;
                return (
                  <td key={j} style={{ 
                      padding: '4px 8px', 
                      textAlign: 'center', 
                      background: isHighlighted ? '#fff9c4' : 'transparent',
                      color: isHighlighted ? '#d32f2f' : 'inherit',
                      fontWeight: isHighlighted ? 'bold' : 'normal',
                      border: '1px solid #eee'
                  }}>
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
            <div key={index} style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
               <h3 style={{margin: '0 0 10px'}}>Calculation Setup</h3>
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
          <div key={index} style={{ margin: '20px 0', padding: '20px', background: '#fafafa', borderRadius: '8px', borderLeft: '5px solid #2196f3', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h4 style={{marginTop: 0, color: '#1976d2'}}>Cofactor Expansion Process</h4>

            <div style={{marginBottom: '20px'}}>
                <strong style={{color: '#333', fontSize: '1.05em'}}>1. Choose a Row or Column</strong>
                <p style={{margin: '5px 0 10px', color: '#555', fontSize: '0.95em'}}>
                    Select any row or column to expand along; choosing one with the most zeros simplifies calculations.
                </p>
                <div style={{padding: '10px', background: 'white', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap'}}>
                    {step.matrix && renderMiniMatrix(
                        step.matrix,
                        isRow ? safeIndex : -1,
                        isRow ? -1 : safeIndex
                    )}
                    <p style={{margin: 0}}>
                        We selected the <strong>{ordinalText} {isRow ? 'Row' : 'Column'}</strong> (highlighted).
                    </p>
                </div>
            </div>

            <div style={{marginBottom: '20px'}}>
                <strong style={{color: '#333', fontSize: '1.05em'}}>2. Determine the Sign Pattern</strong>
                <p style={{margin: '5px 0 10px', color: '#555', fontSize: '0.95em'}}>
                    Use the formula <code style={{background: '#eee', padding: '2px 4px'}}>(-1)<sup>i+j</sup></code> for each element.
                </p>
                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                    {step.terms.map((t, i) => (
                        <div key={i} style={{padding: '5px 10px', background: '#e3f2fd', borderRadius: '4px', border: '1px solid #90caf9', fontSize: '0.9em'}}>
                             <strong>{t.value}</strong> &rarr;<strong>{t.sign > 0 ? '+ (Positive)' : '- (Negative)'}</strong>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{marginBottom: '20px'}}>
                 <strong style={{color: '#333', fontSize: '1.05em'}}>3. Find the Minor</strong>
                 <p style={{margin: '5px 0 10px', color: '#555', fontSize: '0.95em'}}>
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
                <strong style={{color: '#333', fontSize: '1.05em'}}>4. Calculate the Determinant of the Minor</strong>
                <p style={{margin: '5px 0', color: '#555', fontSize: '0.95em'}}>
                    Find the determinant of that smaller submatrix.
                </p>
                <div style={{marginTop: '10px', padding: '15px', background: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: '4px', overflowX: 'auto'}}>
                    <strong style={{color: '#e65100', display: 'block', marginBottom: '10px'}}>Expansion Formula:</strong>
                    <div style={{fontFamily: 'Times New Roman, serif', fontSize: '1.2em', marginTop: '10px', lineHeight: '1.5', display: 'flex', flexWrap: 'wrap', alignItems: 'center'}}>
                        <span style={{marginRight: '10px'}}>det(A) = </span>
                        {step.terms.map((t, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <span style={{margin: '0 8px', fontWeight: 'bold'}}>+</span>}
                                <span style={{
                                    display: 'inline-flex', 
                                    alignItems: 'center',
                                    background: '#fff', 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    border: '1px solid #eee', 
                                    margin: '0 2px'
                                }}>
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

      // STEP 5: Breakdown with proper spacing
      case 'final_sum':
        return (
          <div key={index} style={{ marginTop: '20px', padding: '20px', background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '8px' }}>
             <strong style={{color: '#2e7d32', fontSize: '1.1em'}}>5. Multiply and Sum the Results</strong>
             <p style={{margin: '5px 0 15px', color: '#555'}}>
                Multiply the element by its sign and the determinant of its minor, then sum them up.
             </p>
             
             <div style={{margin: '15px 0', padding: '15px', background: '#fff', borderRadius: '6px', border: '1px solid #dcdcdc'}}>
                <strong style={{color: '#555', display: 'block', marginBottom: '15px'}}>Term Breakdown:</strong>
                {step.terms && step.terms.map((t, i) => (
                   <div key={i} style={{
                       marginBottom: '10px', 
                       fontSize: '1.1em', 
                       fontFamily: 'monospace', 
                       color: '#333', 
                       borderBottom: i < step.terms.length - 1 ? '1px dashed #eee' : 'none', 
                       paddingBottom: '8px'
                   }}>
                       <span style={{color: '#d32f2f', fontWeight: 'bold'}}>{t.value}</span> 
                       <span style={{fontSize: '0.7em', color: '#888', marginLeft: '5px'}}></span>
                       
                       <span style={{margin: '0 15px', color: '#ccc', fontWeight: 'bold'}}>&times;</span>

                       <span style={{color: '#1976d2', fontWeight: 'bold'}}>{t.sign > 0 ? '+1' : '-1'}</span> 
                       <span style={{fontSize: '0.7em', color: '#888', marginLeft: '5px'}}></span>
                       
                       <span style={{margin: '0 15px', color: '#ccc', fontWeight: 'bold'}}>&times;</span>

                       <span style={{color: '#388e3c', fontWeight: 'bold'}}>{t.det}</span> 
                       <span style={{fontSize: '0.7em', color: '#888', marginLeft: '5px'}}></span>

                       <span style={{margin: '0 15px', color: '#333'}}>=</span> 
                       <strong>{t.value * t.sign * t.det}</strong>
                   </div>
                ))}
             </div>

             <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '1.4em', textAlign: 'center', background: '#fff', padding: '15px', borderRadius: '8px', border: '1px dashed #2e7d32' }}>
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
             <div style={{fontSize: '0.9em', color: '#555', borderTop: '1px solid #c8e6c9', paddingTop: '10px'}}>
                 This final value is the determinant of the original matrix.
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{color: '#333'}}>Cofactor Expansion Calculator</h1>
      <p style={{color: '#666', marginBottom: '20px'}}>
        A step-by-step determinant calculator using cofactor expansion.
      </p>

      <div style={{ marginBottom: '30px', padding: '25px', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '10px' }}>
        <div style={{marginBottom: '20px'}}>
            <label style={{fontWeight: '600', marginRight: '10px'}}>Matrix Size: </label>
            <select value={size} onChange={handleSizeChange} style={{padding: '8px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc'}}>
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>{n} x {n}</option>
            ))}
            </select>
        </div>

        <div style={{ overflowX: 'auto', paddingBottom: '10px' }}>
            <div 
                style={{ 
                display: 'grid', 
                gridTemplateColumns: `30px repeat(${size}, 60px)`, 
                gap: '8px', 
                marginBottom: '20px',
                alignItems: 'center'
                }}
            >
                <div></div>
                {Array.from({length: size}).map((_, j) => (
                    <div key={`head-${j}`} style={{textAlign: 'center', fontWeight: 'bold', color: '#888', fontSize: '0.8em'}}>
                        {j + 1}
                    </div>
                ))}

                {matrix.map((row, i) => (
                    <React.Fragment key={`row-${i}`}>
                        <div style={{textAlign: 'right', fontWeight: 'bold', color: '#888', fontSize: '0.8em', paddingRight: '5px'}}>
                            {i + 1}
                        </div>
                        {row.map((cell, j) => (
                            <input
                            key={`${i}-${j}`}
                            type="number"
                            value={cell}
                            onChange={(e) => handleMatrixChange(i, j, e.target.value)}
                            style={{ 
                                width: '60px', 
                                height: '50px', 
                                textAlign: 'center', 
                                fontSize: '18px',
                                border: '1px solid #ccc',
                                borderRadius: '6px',
                                background: '#f9f9f9'
                            }}
                            />
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>

        <button 
            onClick={handleCalculate}
            disabled={isCalculating}
            style={{ 
                padding: '12px 30px', 
                cursor: isCalculating ? 'not-allowed' : 'pointer', 
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: isCalculating ? '#9e9e9e' : '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                transition: 'background 0.2s'
            }}
        >
            {isCalculating ? 'Calculating...' : 'Calculate Determinant'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '30px' }}>
          {result.steps.length > 0 ? result.steps.map(renderStep) : <p>Steps omitted for performance.</p>}
          
          <div style={{ marginTop: '20px', padding: '15px', background: result.isSingular ? '#ffebee' : '#e8f5e9', borderLeft: `5px solid ${result.isSingular ? '#c62828' : '#2e7d32'}`, borderRadius: '4px' }}>
              <h3 style={{margin: '0'}}>Final Answer: {result.determinant}</h3>
              <div style={{color: result.isSingular ? '#c62828' : '#2e7d32', marginTop: '5px'}}>
                  {result.message}
              </div>
          </div>
        </div>
      )}
    </div>
  );
}