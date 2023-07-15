import invariant from 'tiny-invariant';

export function CreateFormData(data: Map<string, string | Blob>) {
  const formData = new FormData();
  for (const [k, v] of data.entries()) {
    formData.append(k, v);
  }
  return formData;
}
