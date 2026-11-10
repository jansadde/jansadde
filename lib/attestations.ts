import type { Entry } from './types';

export const attestationIds = ['attestation-a1', 'attestation-a2', 'attestation-a3', 'attestation-a4'] as const;
const details = [
  ['Business Report', 'Business context, environment and strategic recommendations.'],
  ['Video Essay', 'The Human–AI operating model, presented through video.'],
  ['Photo Essay', 'A visual argument connecting customer experience, technology and trust.'],
  ['Argumentative Essay', 'An evidence-based position on AI and the value of business graduates.'],
];
export const defaultAttestations: Entry[] = details.map(([title, description], index) => ({
  id: attestationIds[index], kind: 'attestation', title, description,
  subtitle: `Assignment ${index + 1}`, period: '', category: '', role: '', result: '', image: '',
  isPublic: true, isExample: false, position: index, primaryFileId: '', supportingFileId: '', sections: [],
}));
