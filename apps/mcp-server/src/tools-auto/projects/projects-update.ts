import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type ProjectsUpdateTool = ToolDefinition<{
  id: z.ZodNumber;
  body: z.ZodObject<{ name: z.ZodNullable<z.ZodString>; description: z.ZodNullable<z.ZodString>; commercial: z.ZodNullable<z.ZodBoolean>; clientId: z.ZodNullable<z.ZodNumber>; status: z.ZodNullable<z.ZodEnum<["open", "in_progress", "finished", "on_hold", "canceled"]>>; managingType: z.ZodNullable<z.ZodEnum<["managed", "coordinated"]>>; teamMembers: z.ZodNullable<z.ZodArray<z.ZodObject<{ userId: z.ZodNumber; mark: z.ZodNullable<z.ZodEnum<["main-pm"]>> }>>>; finishedAt: z.ZodNullable<z.ZodString> }>;
  accessToken: z.ZodString;
}>;

export function getProjectsUpdateTool(): ProjectsUpdateTool {
  const name: string = 'projects-update';

  const config: ProjectsUpdateTool[1] = {
    title: "Update project by ID",
    description: "Updates an existing project and returns the updated project data",
    inputSchema: {
      id: z.number(),
      body: z.object({ name: z.string().nullable(), description: z.string().nullable(), commercial: z.boolean().nullable(), clientId: z.number().nullable(), status: z.enum(["open", "in_progress", "finished", "on_hold", "canceled"]).nullable(), managingType: z.enum(["managed", "coordinated"]).nullable(), teamMembers: z.array(z.object({ userId: z.number(), mark: z.enum(["main-pm"]).nullable() })).nullable(), finishedAt: z.string().nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: ProjectsUpdateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/projects/${params.id}`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
