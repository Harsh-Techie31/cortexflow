import { BrainCircuit, Lock, Layers } from 'lucide-react';

export function Features() {
    const features = [
        {
            title: "Unified Knowledge Layer",
            description: "Connect all your tools. We index GitHub, Gmail, and more to create a single source of truth.",
            icon: Layers,
        },
        {
            title: "AI-Powered Search",
            description: "Forget keywords. Ask questions like 'What was the conclusion of the API key discussion?' and get answers.",
            icon: BrainCircuit,
        },
        {
            title: "Secure Integrations",
            description: "Enterprise-grade security. We use OAuth for all integrations and never store your raw data insecurely.",
            icon: Lock,
        },
    ];

    return (
        <section className="bg-gray-50 py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Why Cortex Flow?
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Everything you need to streamline your team's knowledge management.
                    </p>
                </div>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-start rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
                        >
                            <div className="mb-4 rounded-lg bg-indigo-50 p-3">
                                <feature.icon className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-gray-900">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
