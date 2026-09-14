export async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed.");
  return data.url as string;
}

export async function uploadPaymentProofFile(bookingId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("bookingId", bookingId);
  formData.append("file", file);
  const res = await fetch("/api/upload/payment-proof", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed.");
  return data.url as string;
}
