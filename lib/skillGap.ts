export function calculateSkillGap(
  userSkills: string[],
  requiredSkills: string[]
) {
  const userSkillSet = new Set(
    userSkills.map((skill) => skill.toLowerCase().trim())
  );

  const matchedSkills = requiredSkills.filter((skill) =>
    userSkillSet.has(skill.toLowerCase().trim())
  );

  const missingSkills = requiredSkills.filter(
    (skill) => !userSkillSet.has(skill.toLowerCase().trim())
  );

  const matchPercentage =
    requiredSkills.length === 0
      ? 0
      : Math.round((matchedSkills.length / requiredSkills.length) * 100);

  return {
    matchPercentage,
    matchedSkills,
    missingSkills,
  };
}