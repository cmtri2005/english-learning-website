import { Button } from "@/shared/components/ui/button";
import type { BlogCategory } from "@/services/blog/blog-api";

interface BlogCategoriesProps {
  categories: BlogCategory[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export default function BlogCategories({
  categories,
  selectedCategory,
  onCategoryChange,
}: BlogCategoriesProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onCategoryChange(null)}
      >
        All
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat.category}
          variant={selectedCategory === cat.category ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(cat.category)}
        >
          {cat.category} ({cat.count})
        </Button>
      ))}
    </div>
  );
}

