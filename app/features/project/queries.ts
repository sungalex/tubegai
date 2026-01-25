import client from "~/supa-client";

export const getChannels = async () => {
  const { data, error } = await client.from("channel").select("*");

  if (error) {
    console.error("Error fetching channels:", error);
    return [];
  }

  return data;
};

export const getProjects = async () => {
  const { data, error } = await client.from("project").select("*");

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }

  return data;
};
