import { Server, Request, ResponseToolkit, ResponseValue } from '@hapi/hapi';
import {
  UserModel,
  getModel,
  UserAttributes,
  RoleModel,
  LeanRoleDocument,
  LeanPermissionDocument,
  LeanUserDocument,
  QUEUE_CHANNELS,
  MongoError
} from '@delifood/common';
import Boom from '@hapi/boom';
import Iron from '@hapi/iron';
import Joi from 'joi';
import { Password } from '../utils/Password';

interface PluginRegisterOptions {
  ironSecret: string;
}

const flattenRolesPermissions = function flattenRolesPermissions(
  roles: LeanRoleDocument[]
) {
  const aux: { [key: string]: number } = {};
  const flattened = [];

  for (const role of roles) {
    for (const permission of role.permissions as LeanPermissionDocument[]) {
      aux[permission.value] = 1;
    }
  }

  for (const permission in aux) {
    flattened.push(permission);
  }

  return flattened;
};

const authRoutesPlugin = {
  name: 'auth routes',
  version: '1.0.0',
  register(server: Server, options: PluginRegisterOptions) {
    server.route({
      method: 'POST',
      path: '/signup',
      options: {
        validate: {
          payload: Joi.object({
            email: Joi.string().trim().email().required(),
            password: Joi.string().trim().min(8).required()
          })
        },
        auth: false
      },
      async handler(
        request: Request,
        h: ResponseToolkit
      ): Promise<ResponseValue> {
        try {
          const publish = server.plugins.nats.publish;
          const payload = request.payload as UserAttributes;
          const userModel = getModel<UserModel>(request.server.plugins, 'User');
          const roleModel = getModel<RoleModel>(request.server.plugins, 'Role');
          const userRole = await roleModel.findOne({ name: 'User' }).lean();

          if (!userRole) {
            throw new Error('Default user role does not exist');
          }

          const user = await userModel.create({
            ...payload,
            roles: [userRole._id]
          });

          publish(QUEUE_CHANNELS.USER_CREATED, user);

          return h.response().code(201);
        } catch (error: unknown) {
          console.error(error);
          if ((error as MongoError)?.code === 11000) {
            return Boom.conflict();
          }
          return Boom.internal();
        }
      }
    });

    server.route({
      method: 'POST',
      path: '/signin',
      options: {
        validate: {
          payload: Joi.object({
            email: Joi.string().trim().email().required(),
            password: Joi.string().trim().min(8).required()
          })
        },
        auth: false
      },
      async handler(
        request: Request,
        h: ResponseToolkit
      ): Promise<ResponseValue> {
        try {
          const userModel = getModel<UserModel>(request.server.plugins, 'User');
          const payload = request.payload as UserAttributes;

          const foundUser: LeanUserDocument = await userModel
            .findOne({ email: payload.email })
            .select('+password')
            .populate({ path: 'roles', populate: { path: 'permissions' } })
            .lean();

          if (!foundUser) {
            return Boom.notFound('User does not exist.');
          }

          const passwordsMatch = await Password.compare(
            foundUser.password as string,
            payload.password as string
          );

          if (!passwordsMatch) {
            return Boom.badData('Combination of email/password does not match');
          }

          const userProps = {
            email: foundUser.email,
            roles: (foundUser.roles as LeanRoleDocument[]).map(
              role => role.name
            ),
            permissions: flattenRolesPermissions(
              foundUser.roles as LeanRoleDocument[]
            )
          };

          const token = await Iron.seal(
            {
              user: {
                ...userProps,
                id: foundUser._id,
                email: undefined
              },
              issuedAt: Date.now(),
              expiresAt: Date.now() + 36e5 * 24
            },
            options.ironSecret,
            Iron.defaults
          );

          return h.response({ user: userProps, token });
        } catch (error: unknown) {
          console.error(error);
          return Boom.internal();
        }
      }
    });
  }
};

export { authRoutesPlugin };
