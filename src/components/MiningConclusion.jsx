import React, { useRef } from 'react'

export default function MiningConclusion() {
  const ref = useRef(null);

  const exportPDF = async () => {
    if (!window.jspdf || !window.html2canvas) {
      alert('No se pudo cargar jsPDF/html2canvas. Revisa la conexión.');
      return;
    }
    const node = ref.current;
    const canvas = await window.html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#fff' });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let y = 0;
    let remaining = imgHeight;
    while (remaining > 0) {
      pdf.addImage(imgData, 'PNG', 0, 0 - y, imgWidth, imgHeight);
      remaining -= pageHeight;
      if (remaining > 0) pdf.addPage();
      y += pageHeight;
    }
    pdf.save('conclusion-mineria.pdf');
  };

  return (
    <section style={{marginTop:24}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
        <h2 style={{fontSize:22, fontWeight:600}}>Conclusión para Cliente en la Industria Minera</h2>
        <button onClick={exportPDF} style={{padding:'8px 12px', borderRadius:10, background:'#111827', color:'#fff'}}>
          Exportar PDF
        </button>
      </div>
      <div ref={ref} style={{background:'#fff', borderRadius:14, padding:16, boxShadow:'0 1px 6px rgba(0,0,0,.08)'}}>
        <p><strong>zenon Energy Edition</strong> como <em>Network Control System</em> es la opción más adecuada para un centro de control minero debido a:</p>
        <ul>
          <li>Plataforma unificada (SCADA, DMS, GIS, Historian, etc.).</li>
          <li>Funcionalidades clave nativas (GIS, estimador de estado) sin módulos adicionales.</li>
          <li>Compatibilidad entre versiones: continuidad operativa y menor costo de migración.</li>
          <li>Acceso web nativo (HTML5) y remoto.</li>
          <li>Agnóstico en hardware y antivirus.</li>
          <li>Soporte local en Chile vía integradores certificados.</li>
        </ul>
        <div style={{marginTop:12, background:'#fef3c7', border:'1px solid #fde68a', borderRadius:10, padding:12}}>
          <div style={{fontWeight:600, marginBottom:6}}>Nota de versiones ABB ZEE600 / SEE00</div>
          <p>ZEE600/SEE00 suele operar una versión por detrás de zenon; p.ej., si zenon está en v15, ABB suele estar en v14.</p>
        </div>
      </div>
    </section>
  );
}
