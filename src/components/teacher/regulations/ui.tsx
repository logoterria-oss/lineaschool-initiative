import { ReactNode } from 'react';
import Icon from '@/components/ui/icon';

export const RegPage = ({
  title,
  accent,
  onBack,
  children,
}: {
  title: string;
  accent: 'blue' | 'purple';
  onBack: () => void;
  children: ReactNode;
}) => (
  <div>
    <div className="flex items-center justify-between mb-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <Icon name="ArrowLeft" size={16} />
        Назад
      </button>
      <span className="font-semibold text-gray-900">{title}</span>
    </div>
    <article
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-6 md:px-8 md:py-8 ${
        accent === 'blue' ? 'border-t-4 border-t-blue-500' : 'border-t-4 border-t-purple-500'
      }`}
    >
      <div className="reg-content space-y-4 text-gray-800 leading-relaxed">{children}</div>
    </article>
  </div>
);

export const RegTitle = ({ children }: { children: ReactNode }) => (
  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">{children}</h1>
);

export const RegH2 = ({ children }: { children: ReactNode }) => (
  <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3 pb-2 border-b border-gray-200">
    {children}
  </h2>
);

export const RegH3 = ({ children }: { children: ReactNode }) => (
  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">{children}</h3>
);

export const RegH4 = ({ children }: { children: ReactNode }) => (
  <h4 className="text-base font-semibold text-gray-800 mt-4 mb-1">{children}</h4>
);

export const P = ({ children }: { children: ReactNode }) => (
  <p className="text-[15px]">{children}</p>
);

export const Em = ({ children }: { children: ReactNode }) => (
  <span className="italic text-gray-600">{children}</span>
);

export const B = ({ children }: { children: ReactNode }) => (
  <span className="font-semibold text-gray-900">{children}</span>
);

export const UL = ({ children }: { children: ReactNode }) => (
  <ul className="list-disc pl-6 space-y-1 text-[15px] marker:text-gray-400">{children}</ul>
);

export const OL = ({ children }: { children: ReactNode }) => (
  <ol className="list-decimal pl-6 space-y-1 text-[15px] marker:text-gray-400">{children}</ol>
);

export const LI = ({ children }: { children: ReactNode }) => <li>{children}</li>;

export const Note = ({ children }: { children: ReactNode }) => (
  <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[15px] text-amber-900">
    <Icon name="TriangleAlert" size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
    <div>{children}</div>
  </div>
);

export const RegLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800 break-words"
  >
    {children}
  </a>
);

export const RegImg = ({
  src,
  alt,
  caption,
  size = 'md',
}: {
  src: string;
  alt: string;
  caption?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const max = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';
  return (
    <figure className="my-4">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`w-full ${max} mx-auto rounded-lg border border-gray-200 shadow-sm`}
      />
      {caption && (
        <figcaption className="text-center text-xs text-gray-400 mt-1.5">{caption}</figcaption>
      )}
    </figure>
  );
};
