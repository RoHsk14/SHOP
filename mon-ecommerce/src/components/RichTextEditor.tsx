"use client";

import { useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { supabase } from "@/lib/supabase";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ImageIcon,
  Link2,
  Link2Off,
  Sparkles,
  Wand2,
  Eye,
  Edit3,
} from "lucide-react";
import ProductDescriptionViewer from "./ProductDescriptionViewer";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        HTMLAttributes: { class: "max-w-full h-auto rounded-lg shadow-xs" },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-emerald-600 underline hover:text-emerald-800" },
      }),
      Placeholder.configure({ placeholder: placeholder || "Description détaillée du produit..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose max-w-none focus:outline-none min-h-[220px] px-4 py-3.5 text-gray-800",
      },
    },
    immediatelyRender: false,
  });

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async () => {
      const files = input.files;
      if (!files || !editor) return;
      setUploading(true);
      try {
        const { data: bucket } = await supabase.storage.getBucket("products");
        if (!bucket) {
          await supabase.storage.createBucket("products", { public: true });
        }
        for (const file of Array.from(files)) {
          const fileName = `${Date.now()}-${file.name}`;
          const { data, error } = await supabase.storage
            .from("products")
            .upload(fileName, file);
          if (error) throw error;
          const { data: { publicUrl } } = supabase.storage
            .from("products")
            .getPublicUrl(data.path);
          editor.chain().focus().setImage({ src: publicUrl }).run();
        }
      } catch (error) {
        console.error("Image upload error:", error);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL du lien:", previousUrl || "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // Insert high-converting e-commerce structured description template
  const insertTemplate = () => {
    if (!editor) return;
    const templateHtml = `
      <h3>Retrouvez confort et satisfaction au quotidien</h3>
      <p>Découvrez notre solution spécialement formulée pour répondre à vos besoins avec efficacité, simplicité et sans compromis sur la qualité.</p>
      
      <h3>Pourquoi ce produit est fait pour vous ?</h3>
      <p>Si vous recherchez une solution fiable, rapide et agréable à utiliser :</p>
      <ul>
        <li>Résultats visibles et sensation de confort dès les premières utilisations</li>
        <li>Conçu avec des ingrédients rigoureusement sélectionnés</li>
        <li>Facile à intégrer dans votre routine quotidienne</li>
        <li>Testé et approuvé par des centaines de clients satisfaits</li>
      </ul>

      <h3>Conseils d'utilisation</h3>
      <ul>
        <li><strong>Étape 1 :</strong> Utiliser chaque jour selon les recommandations fournies</li>
        <li><strong>Étape 2 :</strong> Conserver dans un endroit sec et à l'abri de la chaleur</li>
        <li><strong>Étape 3 :</strong> Suivre la cure complète pour des bienfaits durables</li>
      </ul>

      <h3>Notre garantie d'excellence</h3>
      <p>Commandez en toute sérénité : vérifiez votre colis à la livraison avant d'effectuer le paiement.</p>
    `;
    editor.commands.setContent(templateHtml);
    onChange(templateHtml);
  };

  // Automatically clean and structure raw plain text
  const autoFormatRawText = () => {
    if (!editor) return;
    const current = editor.getText();
    if (!current || current.trim().length === 0) return;

    const cleaned = current
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .trim();

    const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);
    let formattedHtml = "";
    let inList = false;

    lines.forEach((line) => {
      const isQuestion =
        /^(Pourquoi|Ce que|Comment|À quoi|Quels|Pour qui|Résultats|Bénéfices|Utilisation)/i.test(line) ||
        (line.length < 80 && line.endsWith("?"));

      const isBullet = /^[•\-\*✓\+]/.test(line);

      if (isQuestion) {
        if (inList) {
          formattedHtml += "</ul>";
          inList = false;
        }
        formattedHtml += `<h3>${line}</h3>`;
      } else if (isBullet) {
        if (!inList) {
          formattedHtml += "<ul>";
          inList = true;
        }
        formattedHtml += `<li>${line.replace(/^[•\-\*✓\+]\s*/, "")}</li>`;
      } else {
        if (inList) {
          formattedHtml += "</ul>";
          inList = false;
        }
        formattedHtml += `<p>${line}</p>`;
      }
    });

    if (inList) {
      formattedHtml += "</ul>";
    }

    editor.commands.setContent(formattedHtml);
    onChange(formattedHtml);
  };

  if (!editor) return null;

  const ToolButton = ({ onClick, active, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
        active
          ? "bg-emerald-100 text-emerald-800 font-bold"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-gray-200" />;

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
      {/* Top action toolbar with Formatting Tools and View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50/80">
        <div className="flex flex-wrap items-center gap-0.5">
          <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Gras">
            <Bold className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italique">
            <Italic className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Souligné">
            <UnderlineIcon className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Barré">
            <Strikethrough className="w-4 h-4" />
          </ToolButton>

          <Divider />

          <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Titre 2">
            <Heading2 className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Titre 3">
            <Heading3 className="w-4 h-4" />
          </ToolButton>

          <Divider />

          <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Liste à puces">
            <List className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Liste numérotée">
            <ListOrdered className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citation">
            <Quote className="w-4 h-4" />
          </ToolButton>

          <Divider />

          <ToolButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Aligné à gauche">
            <AlignLeft className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Centré">
            <AlignCenter className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Aligné à droite">
            <AlignRight className="w-4 h-4" />
          </ToolButton>

          <Divider />

          <ToolButton onClick={handleImageUpload} title="Insérer une image">
            <ImageIcon className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={setLink} active={editor.isActive("link")} title="Ajouter un lien">
            <Link2 className="w-4 h-4" />
          </ToolButton>
          {editor.isActive("link") && (
            <ToolButton onClick={() => editor.chain().focus().unsetLink().run()} title="Supprimer le lien">
              <Link2Off className="w-4 h-4" />
            </ToolButton>
          )}
        </div>

        {/* Right side: Smart Templates & View Mode Toggle */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={autoFormatRawText}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            title="Transformer le texte brut en titres et listes propres"
          >
            <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Formater le texte</span>
          </button>

          <button
            type="button"
            onClick={insertTemplate}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
            title="Insérer un modèle complet haute conversion"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Modèle Pro</span>
          </button>

          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white p-0.5 ml-1">
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`p-1.5 rounded-md text-xs transition-colors flex items-center gap-1 ${
                viewMode === "edit"
                  ? "bg-gray-100 text-gray-900 font-bold"
                  : "text-gray-400 hover:text-gray-700"
              }`}
              title="Mode édition"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`p-1.5 rounded-md text-xs transition-colors flex items-center gap-1 ${
                viewMode === "preview"
                  ? "bg-gray-100 text-gray-900 font-bold"
                  : "text-gray-400 hover:text-gray-700"
              }`}
              title="Aperçu en direct"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content Area vs Live Preview */}
      {viewMode === "edit" ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="p-4 sm:p-5 bg-gray-50/50 min-h-[220px]">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Aperçu sur la boutique
          </div>
          <ProductDescriptionViewer description={editor.getHTML()} />
        </div>
      )}

      {uploading && (
        <div className="px-4 py-2 text-xs text-emerald-600 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
          <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
          Téléchargement des images...
        </div>
      )}
    </div>
  );
}
