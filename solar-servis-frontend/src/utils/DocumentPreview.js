import React, { useState } from "react";
import Mammoth from "mammoth";



const DocumentPreview = ({ templatePath }) => {
  const [htmlContent, setHtmlContent] = useState("");

  const loadTemplate = async () => {
    try {
      const response = await fetch(templatePath);
      const templateArrayBuffer = await response.arrayBuffer();
      const { value } = await Mammoth.convertToHtml({ arrayBuffer: templateArrayBuffer });
      setHtmlContent(value);
    } catch (error) {
      console.error("Chyba při načítání šablony:", error);
    }
  };

  React.useEffect(() => {
    loadTemplate();
  }, [templatePath]);

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
};

export default DocumentPreview;
