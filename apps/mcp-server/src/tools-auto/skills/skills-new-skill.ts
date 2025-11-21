import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type SkillsNewSkillTool = ToolDefinition<{
  body: z.ZodObject<{ name: z.ZodString; users: z.ZodNullable<z.ZodArray<z.ZodNumber>> }>;
  accessToken: z.ZodString;
}>;

export function getSkillsNewSkillTool(): SkillsNewSkillTool {
  const name: string = 'skills-new-skill';

  const config: SkillsNewSkillTool[1] = {
    title: "Create a new skill",
    description: "Creates a new skill entry in the system",
    inputSchema: {
      body: z.object({ name: z.string(), users: z.array(z.number()).nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: SkillsNewSkillTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/skills`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
