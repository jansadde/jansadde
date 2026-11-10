import { requireAdmin, readJson, validateReferences, database, success, apiError, ApiError } from '@/lib/server';

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const data = await readJson(request);
    const references = validateReferences(data?.references);
    const files = await database().prepare('SELECT * FROM documents').all<{id:string}>();
    const known = new Set(files.results.map(file => file.id));
    if (references.some(reference => reference.fileIds.some(id => !known.has(id)))) throw new ApiError(400, 'A linked document was not found.');
    await database().prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('source-references', JSON.stringify(references)).run();
    return success({ references });
  } catch(error) { return apiError(error); }
}
