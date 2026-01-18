const baseUrl = "https://arcraiders.wiki/wiki/";

const ItemCell = ({
  id,
  name,
  imageSrc,
}: {
  name: string;
  imageSrc: string | undefined;
  id?: string;
}) => {
  const capitalizeId = (id?: string) => {
    if (!id) return null;

    // Helper functions for pattern detection
    const isRomanNumeral = (word: string) => /^[IVX]+$/i.test(word);
    const isArcAcronym = (word: string) => word.toUpperCase() === "ARC";
    const isMkPattern = (word: string) => /^mk\d+$/i.test(word);

    const formatMkPattern = (word: string) => {
      const match = word.match(/^mk(\d+)$/i);
      return match ? `Mk._${match[1]}` : word;
    };

    const capitalizeWord = (word: string) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    };

    const words = id.split("_");

    // EDGE CASE 1: Gun variants (e.g., osprey_i, osprey_ii)
    // Remove Roman numeral suffix for guns so all variants share one link
    // Pattern: ONEWORD_NUMBER = gun, MORE_THAN_ONE_WORD_NUMBER = not a gun
    const isGunVariant =
      words.length === 2 && isRomanNumeral(words[words.length - 1]);
    const wordsForUrl = isGunVariant ? words.slice(0, -1) : words;

    // EDGE CASE 2: Augments with mk pattern (e.g., combat_mk3_aggressive)
    // Check if there's a word after the mk pattern that needs parentheses
    const mkIndex = wordsForUrl.findIndex(isMkPattern);
    const hasAugmentPattern = mkIndex !== -1 && mkIndex < wordsForUrl.length - 1;

    // Process each word based on the edge cases
    const processedWords = wordsForUrl.map((word, index) => {
      // EDGE CASE 2: Format mk patterns (mk3 → Mk._3)
      if (isMkPattern(word)) {
        return formatMkPattern(word);
      }

      // EDGE CASE 3: Keep ARC acronym uppercase
      if (isArcAcronym(word)) {
        return "ARC";
      }

      // Keep Roman numerals uppercase (when not stripped by gun variant logic)
      if (isRomanNumeral(word)) {
        return word.toUpperCase();
      }

      // EDGE CASE 2: Wrap last word in parentheses for augment pattern
      const isLastWord = index === wordsForUrl.length - 1;
      if (isLastWord && hasAugmentPattern) {
        return `(${capitalizeWord(word)})`;
      }

      // DEFAULT: Standard capitalization
      return capitalizeWord(word);
    });

    return processedWords.join("_");
  };

  return (
    <div className="cell-item">
      <span className="cell-item__name">
        {id ? (
          <a
            href={`${baseUrl}${capitalizeId(id)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {name}
          </a>
        ) : (
          name
        )}
      </span>
      <figure className="cell-item__image">
        {imageSrc ? <img src={imageSrc} alt={name} /> : null}
      </figure>
    </div>
  );
};

export default ItemCell;
