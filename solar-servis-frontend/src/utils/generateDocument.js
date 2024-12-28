import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

export const generateDocument = async (templatePath, data) => {
  try {
    // Načtení šablony
    const response = await fetch(templatePath);
    const templateArrayBuffer = await response.arrayBuffer();

    // Inicializace Docxtemplateru
    const zip = new PizZip(templateArrayBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Nastavení dat
    doc.render(data);

    // Vygenerování dokumentu
    const output = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // Stažení dokumentu
    saveAs(output, "GeneratedDocument.docx");
  } catch (error) {
    console.error("Chyba při generování dokumentu:", error);
  }
};
