export default function NutritionPanel({ nutrition, servings = 1 }) {
  if (!nutrition) return null;
  const n = nutrition;
  const items = [
    { label: 'Calories',  value: n.calories, unit: 'kcal' },
    { label: 'Protein',   value: n.protein,  unit: 'g' },
    { label: 'Carbs',     value: n.carbs,    unit: 'g' },
    { label: 'Fat',       value: n.fat,      unit: 'g' },
    { label: 'Fibre',     value: n.fibre,    unit: 'g' },
    { label: 'Sugar',     value: n.sugar,    unit: 'g' },
  ];
  return (
    <div className="nutrition-grid">
      {items.map(({ label, value, unit }) => (
        <div key={label} className="nutrition-cell">
          <span className="nutrition-value">{value ?? 0}{unit}</span>
          <span className="nutrition-label">{label}</span>
        </div>
      ))}
      {servings > 1 && (
        <p className="nutrition-note">Per serving · {servings} servings total</p>
      )}
    </div>
  );
}
