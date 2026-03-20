import { useState } from "react";
import { Share2, Facebook, Twitter, Link2, MessageCircle, Check } from "lucide-react";
import { toast } from "sonner";

const SITE_URL = "https://groupeyamaplus.com";

export default function ShareButtons({ product }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const productUrl = `${SITE_URL}/product/${product.product_id}`;
  const text = `${product.name} - ${product.short_description || ""} | GROUPE YAMA+`;

  const shareLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "hover:bg-[#1877F2]/10 hover:text-[#1877F2]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
      testId: "share-facebook",
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "hover:bg-black/10 hover:text-black dark:hover:bg-white/10 dark:hover:text-white",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productUrl)}`,
      testId: "share-twitter",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "hover:bg-[#25D366]/10 hover:text-[#25D366]",
      url: `https://wa.me/?text=${encodeURIComponent(`${text}\n${productUrl}`)}`,
      testId: "share-whatsapp",
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  return (
    <div className="relative" data-testid="share-buttons">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid="share-toggle-btn"
      >
        <Share2 className="w-4 h-4" />
        Partager
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#2C2C2E] rounded-xl shadow-lg border border-black/10 dark:border-white/10 p-2 flex gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {shareLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${link.color}`}
              title={`Partager sur ${link.name}`}
              data-testid={link.testId}
            >
              <link.icon className="w-4 h-4" />
            </a>
          ))}
          <button
            onClick={handleCopy}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-black/10 dark:hover:bg-white/10"
            title="Copier le lien"
            data-testid="share-copy-link"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
