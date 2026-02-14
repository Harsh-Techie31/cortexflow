import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Hero() {
    return (
        <section className="flex flex-col items-center justify-center space-y-10 py-24 text-center md:py-32">
            <div className="container px-4 md:px-6">
                <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4">
                    <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-500/20">
                        Coming Soon: Notion & Slack Integration
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
                        Unified AI Knowledge Search <br className="hidden sm:inline" />
                        <span className="text-indigo-600">Across Your Team Tools</span>
                    </h1>
                    <p className="max-w-[700px] text-lg text-gray-600 md:text-xl">
                        Stop searching manually. Connect GitHub, Gmail, and more to find everything in one place using natural language.
                    </p>
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Link href="/signup">
                            <Button size="lg" className="w-full sm:w-auto">
                                Get Started for Free
                            </Button>
                        </Link>
                        <Button variant="outline" size="lg" className="w-full sm:w-auto">
                            View Demo
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
