import { route } from 'preact-router';
import { useState } from 'preact/hooks';
import { Clouds } from '../components/Clouds';

export function Landing() {
  const [code, setCode] = useState('');

  const join = (e: Event) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length !== 4) return;
    route(`/play?code=${c}`);
  };

  return (
    <div class="relative min-h-screen overflow-hidden">
      <Clouds />
      <div class="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div class="text-center mb-10">
          <div class="text-7xl float mb-4">🍄</div>
          <h1 class="pixel text-3xl md:text-5xl text-white mb-3" style={{ textShadow: '4px 4px 0 #000' }}>
            PEOPLE'S GAME
          </h1>
          <p class="pixel text-yellow-300 text-xs md:text-sm" style={{ textShadow: '2px 2px 0 #000' }}>
            ★ World 1: The Icebreaker ★
          </p>
        </div>

        <div class="card p-6 w-full max-w-sm space-y-4">
          <button
            type="button"
            class="btn-mario btn-yellow w-full"
            onClick={() => route('/host')}
          >
            🎮 Host Game
          </button>

          <div class="flex items-center gap-3">
            <div class="flex-1 h-px bg-gray-300" />
            <span class="text-gray-500 text-xs pixel">OR</span>
            <div class="flex-1 h-px bg-gray-300" />
          </div>

          <form onSubmit={join} class="space-y-3">
            <label class="block text-sm font-bold text-gray-700">
              Enter Game Code
            </label>
            <input
              class="input-mario text-center pixel text-2xl tracking-widest uppercase"
              placeholder="XXXX"
              maxLength={4}
              value={code}
              onInput={(e: any) => setCode(e.target.value.toUpperCase())}
            />
            <button
              type="submit"
              class="btn-mario btn-green w-full"
              disabled={code.trim().length !== 4}
            >
              ▶ Join Game
            </button>
          </form>
        </div>

        <p class="mt-8 text-white text-xs pixel opacity-80">
          Built for Pursuit · 1-Up your Network
        </p>
      </div>
    </div>
  );
}
