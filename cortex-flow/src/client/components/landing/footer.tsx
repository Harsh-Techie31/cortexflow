import Link from 'next/link';

export function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-white py-12">
            <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 md:px-6 md:flex-row">
                <p className="text-sm text-gray-500">
                    © {new Date().getFullYear()} Cortex Flow. All rights reserved.
                </p>
                <nav className="flex gap-4 sm:gap-6">
                    <Link href="#" className="text-sm font-medium text-gray-500 hover:underline hover:text-gray-900">
                        Terms of Service
                    </Link>
                    <Link href="#" className="text-sm font-medium text-gray-500 hover:underline hover:text-gray-900">
                        Privacy Policy
                    </Link>
                    <Link href="#" className="text-sm font-medium text-gray-500 hover:underline hover:text-gray-900">
                        Contact
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
