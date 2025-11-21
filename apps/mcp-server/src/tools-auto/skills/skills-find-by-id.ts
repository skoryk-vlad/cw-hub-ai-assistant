import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type SkillsFindByIdTool = ToolDefinition<{
  id: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getSkillsFindByIdTool(): SkillsFindByIdTool {
  const name: string = 'skills-find-by-id';

  const config: SkillsFindByIdTool[1] = {
    title: "Retrieve skill by ID",
    description: "Fetches a skill object based on its unique identifier.",
    inputSchema: {
      id: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: SkillsFindByIdTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(`${process.env.APP_URL}/skills/${params.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const responseString = JSON.stringify(response.data);
      return { content: [{ type: 'text', text: responseString }] };
    } catch (err) {
      let error =
        err instanceof AxiosError
          ? JSON.stringify(err.response.data)
          : JSON.stringify(err);

      return {
        content: [
          {
            type: 'text',
            text: `Request failed. Error: ${error}`,
          },
        ],
      };
    }
  };

  return [name, config, cb];
}
