import { formatTime } from '../../utils/formatters';
import TagPill from '../../components/TagPill';

const ACCENT_CLASSES = ['recipe-card-accent-0','recipe-card-accent-1','recipe-card-accent-2','recipe-card-accent-3','recipe-card-accent-4','recipe-card-accent-5'];

export default function RecipeCard({ recipe, settings, index, onOpenDetail }) {
  const accentClass = ACCENT_CLASSES[index % ACCENT_CLASSES.length];
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);

  return (
    <div
      className={`recipe-card ${accentClass}`}
      onClick={() => onOpenDetail && onOpenDetail(recipe)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpenDetail && onOpenDetail(recipe)}
      aria-label={`Open ${recipe.title}`}
    >
      <div className="recipe-card-strip" />
      <div className="recipe-card-content">
        <div className="recipe-card-top">
          <div className="recipe-card-title">{recipe.title}</div>
          <span className="recipe-card-arrow">›</span>
        </div>
        <div className="recipe-card-meta">
          {totalTime > 0 && <span>{formatTime(totalTime)}</span>}
          {totalTime > 0 && recipe.servings && <span className="recipe-card-dot" />}
          {recipe.servings && <span>{recipe.servings} servings</span>}
          {recipe.description && (
            <>
              <span className="recipe-card-dot" />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                {recipe.description}
              </span>
            </>
          )}
        </div>
        {recipe.tags?.length > 0 && (
          <div className="recipe-card-tags">
            {recipe.tags.slice(0, 3).map(tag => <TagPill key={tag} label={tag} />)}
          </div>
        )}
      </div>
    </div>
  );
}
