import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center font-sans">
      <div className="text-center animate-scale-in">
        <div className="text-8xl font-black gradient-text mb-4">404</div>
        <p className="text-textDim text-lg mb-8">This page doesn't exist.</p>
        <button onClick={() => navigate('/')}
          className="btn-primary px-8 py-3 text-base shadow-glow">
          Go Home
        </button>
      </div>
    </div>
  );
}
