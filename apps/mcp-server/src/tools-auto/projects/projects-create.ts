import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type ProjectsCreateTool = ToolDefinition<{
  body: z.ZodObject<{ name: z.ZodString; description: z.ZodNullable<z.ZodString>; commercial: z.ZodBoolean; status: z.ZodNullable<z.ZodEnum<["open", "in_progress", "finished", "on_hold", "canceled"]>>; managingType: z.ZodEnum<["managed", "coordinated"]>; teamMembersIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>; clientId: z.ZodNullable<z.ZodNumber>; teamMembers: z.ZodNullable<z.ZodArray<z.ZodObject<{ userId: z.ZodNumber; mark: z.ZodNullable<z.ZodEnum<["main-pm"]>> }>>> }>;
  accessToken: z.ZodString;
}>;

export function getProjectsCreateTool(): ProjectsCreateTool {
  const name: string = 'projects-create';

  const config: ProjectsCreateTool[1] = {
    title: "Create a new project",
    description: "Creates and returns a newly created project",
    inputSchema: {
      body: z.object({ name: z.string(), description: z.string().nullable(), commercial: z.boolean(), status: z.enum(["open", "in_progress", "finished", "on_hold", "canceled"]).nullable(), managingType: z.enum(["managed", "coordinated"]), teamMembersIds: z.array(z.number()).nullable(), clientId: z.number().nullable(), teamMembers: z.array(z.object({ userId: z.number(), mark: z.enum(["main-pm"]).nullable() })).nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: ProjectsCreateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/projects`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
