import { TrackingForm } from '../components/TrackingForm';

export function CreateTracking() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">New Content Tracking</h1>
            </div>
            <p className="text-gray-500">
                Register creators and keywords to automatically collect and analyze social media content.
            </p>
            <TrackingForm />
        </div>
    );
}
