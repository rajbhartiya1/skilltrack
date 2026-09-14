import { supabase } from "./supabase";

export type ApplicationStatus =
  | "Wishlist"
  | "Applied"
  | "Interview"
  | "Offer";

export type Application = {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  applied_at: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    description: string | null;
  } | null;
};

export async function getApplications() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: [],
      error: "Please login first.",
    };
  }

  const { data, error } = await supabase
    .from("applications")
    .select(`
      id,
      user_id,
      job_id,
      status,
      applied_at,
      job:jobs (
        id,
        title,
        company,
        location,
        description
      )
    `)
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error.message);

    return {
      data: [],
      error: error.message,
    };
  }

  return {
    data: (data || []) as unknown as Application[],
    error: "",
  };
}


export async function applyForJob(jobId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Please login first.",
    };
  }

  const { data: existingApplication } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle();

  if (existingApplication) {
    return {
      success: false,
      message: "You have already applied for this job.",
    };
  }

  const { error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      job_id: jobId,
      status: "Applied",
    });

  if (error) {
    console.error("Error applying for job:", error.message);

    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: "Application submitted successfully!",
  };
}


export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Please login first.",
    };
  }

  const { error } = await supabase
    .from("applications")
    .update({
      status,
    })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    console.error(
      "Error updating application:",
      error.message
    );

    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: "Application status updated.",
  };
}


export async function removeApplication(applicationId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Please login first.",
    };
  }

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    console.error(
      "Error removing application:",
      error.message
    );

    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: "Application removed.",
  };
}