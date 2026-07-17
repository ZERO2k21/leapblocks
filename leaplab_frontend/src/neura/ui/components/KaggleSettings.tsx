import React, { useState, useEffect } from 'react'
import {
    getStoredCredentials,
    storeCredentials,
    clearCredentials,
    testCredentials,
    hasCredentials,
    type KaggleCredentials
} from '../../ml/KaggleDatasetProvider'

interface KaggleSettingsProps {
    onCredentialsSaved?: () => void
    compact?: boolean
}

export default function KaggleSettings({ onCredentialsSaved, compact = false }: KaggleSettingsProps) {
    const [username, setUsername] = useState('')
    const [apiKey, setApiKey] = useState('')
    const [isConnected, setIsConnected] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        setIsConnected(hasCredentials())
        const stored = getStoredCredentials()
        if (stored) {
            setUsername(stored.username)
        }
    }, [])

    const handleTestAndSave = async () => {
        if (!username.trim() || !apiKey.trim()) {
            setError('Please enter both username and API key')
            return
        }

        setIsTesting(true)
        setError(null)

        try {
            const valid = await testCredentials({ username: username.trim(), apiKey: apiKey.trim() })
            if (valid) {
                storeCredentials({ username: username.trim(), apiKey: apiKey.trim() })
                setIsConnected(true)
                setShowForm(false)
                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000)
                onCredentialsSaved?.()
            } else {
                setError('Invalid credentials. Please check your username and API key.')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to test credentials')
        } finally {
            setIsTesting(false)
        }
    }

    const handleDisconnect = () => {
        clearCredentials()
        setIsConnected(false)
        setUsername('')
        setApiKey('')
    }

    // Compact view (just a badge/button)
    if (compact) {
        return (
            <div className="flex items-center gap-2">
                {isConnected ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-[#d1fae5] rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-[#006c44]" />
                        <span className="text-[10px] font-bold text-[#006c44]">Kaggle Connected</span>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-1.5 px-2 py-1 bg-[#eaedff] rounded-lg hover:bg-[#dae2fd] transition-all"
                    >
                        <span className="text-xs">🔗</span>
                        <span className="text-[10px] font-bold text-[#630ed4]">Connect Kaggle</span>
                    </button>
                )}

                {/* Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-extrabold text-[#131b2e]">🔗 Connect Kaggle</h3>
                                <button onClick={() => setShowForm(false)} className="text-[#4a4455] hover:text-[#131b2e]">✕</button>
                            </div>

                            <KaggleCredentialsForm
                                username={username}
                                apiKey={apiKey}
                                setUsername={setUsername}
                                setApiKey={setApiKey}
                                error={error}
                                isTesting={isTesting}
                                onSave={handleTestAndSave}
                                onCancel={() => setShowForm(false)}
                            />
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Full view
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#dae2fd] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🔗</span>
                    <h3 className="text-sm font-extrabold text-[#131b2e]">Kaggle Connection</h3>
                </div>
                {isConnected ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-[#d1fae5] rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-[#006c44] animate-pulse" />
                        <span className="text-[10px] font-bold text-[#006c44]">Connected</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-[#eaedff] rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-[#ccc3d8]" />
                        <span className="text-[10px] font-bold text-[#4a4455]">Not connected</span>
                    </div>
                )}
            </div>

            {isConnected && !showForm ? (
                <div>
                    <p className="text-xs text-[#4a4455] mb-3">
                        Connected as <span className="font-bold text-[#131b2e]">{username}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 bg-[#eaedff] text-[#630ed4] rounded-xl text-xs font-bold hover:bg-[#dae2fd] transition-all"
                        >
                            ⚙️ Settings
                        </button>
                        <button
                            onClick={handleDisconnect}
                            className="px-4 py-2 bg-[#fee2e2] text-[#991b1b] rounded-xl text-xs font-bold hover:bg-[#fecaca] transition-all"
                        >
                            Disconnect
                        </button>
                    </div>
                </div>
            ) : showForm ? (
                <KaggleCredentialsForm
                    username={username}
                    apiKey={apiKey}
                    setUsername={setUsername}
                    setApiKey={setApiKey}
                    error={error}
                    isTesting={isTesting}
                    onSave={handleTestAndSave}
                    onCancel={() => { setShowForm(false); setError(null) }}
                />
            ) : (
                <div>
                    <p className="text-xs text-[#4a4455] mb-3">
                        Connect your Kaggle account to download datasets directly into NEURA.
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold hover:shadow-md transition-all"
                    >
                        🔗 Connect Kaggle
                    </button>
                </div>
            )}

            {success && (
                <div className="mt-3 p-2 bg-[#d1fae5] rounded-lg text-center">
                    <p className="text-xs font-bold text-[#006c44]">✅ Connected successfully!</p>
                </div>
            )}
        </div>
    )
}

function KaggleCredentialsForm({
    username,
    apiKey,
    setUsername,
    setApiKey,
    error,
    isTesting,
    onSave,
    onCancel
}: {
    username: string
    apiKey: string
    setUsername: (v: string) => void
    setApiKey: (v: string) => void
    error: string | null
    isTesting: boolean
    onSave: () => void
    onCancel: () => void
}) {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-[#4a4455] block mb-1">Kaggle Username</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your-username"
                    className="w-full px-3 py-2 text-sm border border-[#dae2fd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#630ed4]"
                />
            </div>
            <div>
                <label className="text-xs font-bold text-[#4a4455] block mb-1">API Key</label>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="your-api-key"
                    className="w-full px-3 py-2 text-sm border border-[#dae2fd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#630ed4]"
                />
            </div>

            <div className="bg-[#f2f3ff] rounded-xl p-3">
                <p className="text-[10px] font-bold text-[#630ed4] mb-1">How to get your API key:</p>
                <ol className="text-[10px] text-[#4a4455] space-y-0.5 list-decimal list-inside">
                    <li>Go to <span className="font-bold">kaggle.com</span> and create a free account</li>
                    <li>Click your profile picture → <span className="font-bold">Settings</span></li>
                    <li>Scroll to <span className="font-bold">API</span> section</li>
                    <li>Click <span className="font-bold">Create New Token</span></li>
                    <li>Copy your username and API key from the downloaded file</li>
                </ol>
            </div>

            {error && (
                <div className="bg-[#fee2e2] rounded-xl px-3 py-2">
                    <p className="text-xs font-bold text-[#991b1b]">{error}</p>
                </div>
            )}

            <div className="flex gap-2">
                <button
                    onClick={onSave}
                    disabled={isTesting}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                    {isTesting ? (
                        <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Testing...
                        </>
                    ) : (
                        <>✅ Save & Test</>
                    )}
                </button>
                <button
                    onClick={onCancel}
                    disabled={isTesting}
                    className="px-4 py-2.5 bg-[#eaedff] text-[#4a4455] rounded-xl text-xs font-bold hover:bg-[#dae2fd] transition-all"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}
