export type UserSkill = {
  name: string;
  level: number;
};

export type SkillGapResult = {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  improvingSkills: string[];
};

const DEFAULT_REQUIRED_LEVEL = 70;

export function calculateSkillGap(
  userSkills: UserSkill[] | string[],
  requiredSkills: string[]
): SkillGapResult {
  // Convert old string[] format into the new skill object format
  const normalizedUserSkills: UserSkill[] = userSkills
    .map((skill) => {
      if (typeof skill === "string") {
        return {
          name: skill,
          level: DEFAULT_REQUIRED_LEVEL,
        };
      }

      if (
        skill &&
        typeof skill === "object" &&
        typeof skill.name === "string"
      ) {
        return {
          name: skill.name,
          level: Number(skill.level) || 0,
        };
      }

      return null;
    })
    .filter((skill): skill is UserSkill => skill !== null);

  // Create a map of user's skills
  const userSkillMap = new Map<string, number>();

  normalizedUserSkills.forEach((skill) => {
    const skillName = skill.name.trim().toLowerCase();

    if (!skillName) {
      return;
    }

    userSkillMap.set(
      skillName,
      Math.max(0, Math.min(100, skill.level))
    );
  });

  // Clean required skills
  const cleanRequiredSkills = (requiredSkills || [])
    .filter((skill) => typeof skill === "string")
    .map((skill) => skill.trim())
    .filter(Boolean);

  if (cleanRequiredSkills.length === 0) {
    return {
      matchPercentage: 0,
      matchedSkills: [],
      missingSkills: [],
      improvingSkills: [],
    };
  }

  let totalScore = 0;

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const improvingSkills: string[] = [];

  cleanRequiredSkills.forEach((requiredSkill) => {
    const key = requiredSkill.toLowerCase();

    const userLevel = userSkillMap.get(key);

    // Skill completely missing
    if (userLevel === undefined || userLevel === 0) {
      missingSkills.push(requiredSkill);
      return;
    }

    // Calculate how close the user's proficiency is
    // to the expected 70% level.
    const skillScore = Math.min(
      100,
      Math.round(
        (userLevel / DEFAULT_REQUIRED_LEVEL) * 100
      )
    );

    totalScore += skillScore;

    // Skill meets required level
    if (userLevel >= DEFAULT_REQUIRED_LEVEL) {
      matchedSkills.push(requiredSkill);
    } else {
      // Skill exists but needs improvement
      improvingSkills.push(requiredSkill);
    }
  });

  const matchPercentage = Math.min(
    100,
    Math.round(
      totalScore / cleanRequiredSkills.length
    )
  );

  return {
    matchPercentage,
    matchedSkills,
    missingSkills,
    improvingSkills,
  };
}