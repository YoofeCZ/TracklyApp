// Cesta: services/docxService.js
import { Document, Packer, Paragraph } from 'docx';

/**
 * Vygenerování dokumentu Word na základě zadaného reportu
 * @param {Object} report - Objekt obsahující data o reportu
 * @returns {Promise<Buffer>} - Vrací Promise s Buffer, který představuje vygenerovaný dokument
 */
export async function generateWordDocument(report) {
    const sections = [
        new Paragraph({ text: `Report: ${report.opCode}`, heading: "Title" }),
        new Paragraph({ text: `Client: ${report.Client.name}` }),
        new Paragraph({ text: `Technician: ${report.Technician.name}` }),
        new Paragraph({ text: `Total Costs: ${report.totalCosts}` }),
    ];

    report.tasks.forEach((task, index) => {
        sections.push(new Paragraph({ text: `Task ${index + 1}:` }));

        task.materials.forEach((material) => {
            sections.push(
                new Paragraph({
                    text: `- ${material.name}: ${material.quantity} x ${material.unitPrice}`,
                })
            );
        });
    });

    const doc = new Document({ sections: [{ children: sections }] });
    return await Packer.toBuffer(doc);
}
