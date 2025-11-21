import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type UsersFindAllTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  startDate: z.ZodNullable<z.ZodString>;
  endDate: z.ZodNullable<z.ZodString>;
  userIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  sortDirection: z.ZodNullable<z.ZodEnum<["DESC", "ASC"]>>;
  sortField: z.ZodNullable<z.ZodEnum<["name", "surname", "fullName", "email", "role", "startWorkingDate", "disabledAt", "isApproved", "allocation", "startJobHistory"]>>;
  isBillable: z.ZodNullable<z.ZodBoolean>;
  userStatus: z.ZodNullable<z.ZodEnum<["all", "inactive", "active"]>>;
  approvedStatus: z.ZodNullable<z.ZodEnum<["approved", "decline", "not-approved"]>>;
  roleIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  excludeRoles: z.ZodNullable<z.ZodArray<z.ZodString>>;
  name: z.ZodNullable<z.ZodString>;
  nameOrEmail: z.ZodNullable<z.ZodString>;
  isFinishedOnboarding: z.ZodNullable<z.ZodBoolean>;
  isEndTrialPeriodDate: z.ZodNullable<z.ZodBoolean>;
  accessToken: z.ZodString;
}>;

export function getUsersFindAllTool(): UsersFindAllTool {
  const name: string = 'users-find-all';

  const config: UsersFindAllTool[1] = {
    title: "Retrieve all users",
    description: "Returns a list of users",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      userIds: z.array(z.number()).nullable(),
      sortDirection: z.enum(["DESC", "ASC"]).nullable(),
      sortField: z.enum(["name", "surname", "fullName", "email", "role", "startWorkingDate", "disabledAt", "isApproved", "allocation", "startJobHistory"]).nullable(),
      isBillable: z.boolean().nullable(),
      userStatus: z.enum(["all", "inactive", "active"]).nullable(),
      approvedStatus: z.enum(["approved", "decline", "not-approved"]).nullable(),
      roleIds: z.array(z.number()).nullable(),
      excludeRoles: z.array(z.string()).nullable(),
      name: z.string().nullable(),
      nameOrEmail: z.string().nullable(),
      isFinishedOnboarding: z.boolean().nullable(),
      isEndTrialPeriodDate: z.boolean().nullable(),
      accessToken: z.string(),
    },
  };

  const cb: UsersFindAllTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/users`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
