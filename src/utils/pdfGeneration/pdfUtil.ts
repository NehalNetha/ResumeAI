import { toast } from "sonner";

/**
 * Generates a PDF preview from LaTeX content
 * @param latexContent The LaTeX content to compile
 * @returns A Promise that resolves to a URL for the PDF preview
 */
export const generatePdfPreview = async (latexContent: string): Promise<string> => {
  if (!latexContent) {
    toast.error("No LaTeX content to compile");
    return '';
  }

  const previewToast = toast.loading("Generating PDF preview...");

  try {
    const compileEndpoint = 'https://latex-compiler-1082803956279.asia-south1.run.app/compile';

    const response = await fetch(compileEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latex_content: latexContent,
        target_filename: "resume.tex"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PDF Compilation Error:", errorText);
      toast.dismiss(previewToast);
      toast.error(`Preview generation failed: ${errorText.substring(0, 500)}...`);
      return '';
    }

    // Get the PDF as a blob
    const blob = await response.blob();

    // Check if the blob is of PDF type
    if (blob.type !== 'application/pdf') {
      console.error("Received non-PDF response:", blob.type);
      toast.dismiss(previewToast);
      toast.error("Failed to generate preview: Server returned unexpected content type.");
      return '';
    }

    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    toast.dismiss(previewToast);
    return url;
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    toast.dismiss(previewToast);
    toast.error(error instanceof Error ? `Preview Error: ${error.message}` : "An unexpected error occurred");
    return '';
  }
};



/**
 * Downloads a PDF generated from LaTeX content
 * @param latexContent The LaTeX content to compile and download
 * @param filename Optional custom filename for the downloaded PDF
 */
export const downloadPdf = async (latexContent: string, filename: string = 'resume.pdf'): Promise<void> => {
  if (!latexContent) {
    toast.error("No LaTeX content to compile");
    return;
  }

  const downloadToast = toast.loading("Compiling PDF...");

  try {
    const compileEndpoint = 'https://latex-compiler-1082803956279.asia-south1.run.app/compile';

    const response = await fetch(compileEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latex_content: latexContent,
        target_filename: "resume.tex"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PDF Compilation Error Response:", errorText);
      toast.dismiss(downloadToast);
      toast.error(`Compilation failed: ${errorText.substring(0, 500)}...`);
      return;
    }

    // Get the PDF as a blob
    const blob = await response.blob();

    // Check if the blob is of PDF type
    if (blob.type !== 'application/pdf') {
      console.error("Received non-PDF response:", blob.type);
      toast.dismiss(downloadToast);
      toast.error("Failed to compile: Server returned unexpected content type.");
      return;
    }

    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create a temporary anchor element to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.dismiss(downloadToast);
    toast.success("PDF downloaded successfully!");
  } catch (error) {
    console.error('Error downloading PDF:', error);
    toast.dismiss(downloadToast);
    toast.error(error instanceof Error ? `Download Error: ${error.message}` : "An unexpected error occurred during download");
  }
};