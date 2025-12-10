// -----------------------------
// FILE NAME: Footer.tsx
// Location: ClarityLearn-2.0/components/Footer.tsx
// Purpose: Footer with links and info
// -----------------------------

'use client';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">CL</span>
              </div>
              <span className="text-xl font-bold text-white">
                ClarityLearn 2.0
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Gamified blockchain dictionary. Stake to learn, earn rewards.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/learn" className="text-sm hover:text-purple-400 transition-colors">
                  Start Learning
                </a>
              </li>
              <li>
                <a href="/stake" className="text-sm hover:text-purple-400 transition-colors">
                  Create Stake
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-sm hover:text-purple-400 transition-colors">
                  My Dashboard
                </a>
              </li>
              <li>
                <a href="/leaderboard" className="text-sm hover:text-purple-400 transition-colors">
                  Leaderboard
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://docs.stacks.co" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:text-purple-400 transition-colors"
                >
                  Stacks Docs
                </a>
              </li>
              <li>
                <a 
                  href="https://explorer.hiro.so/?chain=testnet" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:text-purple-400 transition-colors"
                >
                  Testnet Explorer
                </a>
              </li>
              <li>
                <a 
                  href="https://www.hiro.so/wallet" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:text-purple-400 transition-colors"
                >
                  Get Wallet
                </a>
              </li>
            </ul>
          </div>

          {/* Developer Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Developer</h3>
            <p className="text-sm text-gray-400 mb-2">
              Built by <span className="text-purple-400">Abiodun Adebisi</span>
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Stacks Ascent Level 2
            </p>
            <div className="flex gap-3">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-400">
            © 2024 ClarityLearn 2.0. Testnet deployment for Stacks Ascent Level 2.
          </p>
        </div>
      </div>
    </footer>
  );
}