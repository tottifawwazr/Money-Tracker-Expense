
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) return "Mulai tambahkan transaksi untuk mendapatkan saran keuangan dari AI.";

  // Ambil API Key secara aman dari environment variable
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
  
  if (!apiKey) {
    console.warn("API Key tidak ditemukan. Pastikan sudah menyetel environment variable API_KEY.");
    return "Ups, AI Advisor sedang beristirahat karena konfigurasi kunci tidak ditemukan.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const expenseData = transactions
    .filter(t => t.type === 'expense')
    .map(t => `${t.category}: ${t.amount}`)
    .join(', ');

  const prompt = `
    Saya memiliki data pengeluaran berikut: ${expenseData}. 
    Berikan saran keuangan sangat singkat (maksimal 2 kalimat) dalam Bahasa Indonesia untuk membantu saya menghemat uang.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Terjadi kesalahan saat mengambil saran.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Maaf, AI Advisor sedang sibuk. Coba lagi nanti!";
  }
};
