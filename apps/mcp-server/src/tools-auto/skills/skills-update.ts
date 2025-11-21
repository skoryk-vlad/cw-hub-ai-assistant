import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type SkillsUpdateTool = ToolDefinition<{
  id: z.ZodNumber;
  body: z.ZodObject<{ name: z.ZodNullable<z.ZodString> }>;
  accessToken: z.ZodString;
}>;

export function getSkillsUpdateTool(): SkillsUpdateTool {
  const name: string = 'skills-update';

  const config: SkillsUpdateTool[1] = {
    title: "Update skill by ID",
    description: "Updates a skill and returns affected count",
    inputSchema: {
      id: z.number(),
      body: z.object({ name: z.string().nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: SkillsUpdateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/skills/${params.id}`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
