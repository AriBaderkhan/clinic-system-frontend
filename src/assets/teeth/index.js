// Realistic permanent-teeth cut-outs (transparent PNGs), keyed by FDI number.
// Source asset licensed for use — credit: designed by macrovector - Magnific.com
const files = import.meta.glob("./*.png", { eager: true, import: "default" });

const TEETH = {};
for (const path in files) {
  const m = path.match(/(\d+)\.png$/);
  if (m) TEETH[m[1]] = files[path];
}

// Anatomy fix (per doctor): the lower first & third molars shipped as 3-root
// cut-outs, but clinically they have 2 roots like the second molar. Reuse the
// 2-root second-molar image — 37 for the left side (36/38), 47 for the right
// side (46/48) — so they render "same as 37".
TEETH["36"] = TEETH["37"];
TEETH["38"] = TEETH["37"];
TEETH["46"] = TEETH["47"];
TEETH["48"] = TEETH["47"];

// Upper second molars (17/27) should look like the 3-root upper molar 18. Use the
// side-correct twin so orientation stays right: 17 -> 18 (right), 27 -> 28 (left).
TEETH["17"] = TEETH["18"];
TEETH["27"] = TEETH["28"];

export default TEETH;
