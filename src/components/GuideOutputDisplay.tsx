import type { GuideOutput } from '@/app/types';
const formatUserStory = (story: any): string => { /* same helper function as before */
    if (typeof story === 'string') return `"${story}"`;
    if (typeof story === 'object' && story !== null) return Object.values(story).join(' ');
    return 'Not specified';
};
export default function GuideOutputDisplay({ data }: { data: GuideOutput }) {
  return (
    <div>
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="mt-2">
          <p className="font-semibold">{key.replace(/([A-Z])/g, ' $1').trim()}:</p>
          <p className="text-gray-700">{Array.isArray(value) ? value.join(', ') : (key === 'UserStory' ? formatUserStory(value) : String(value))}</p>
        </div>
      ))}
    </div>
  );
}