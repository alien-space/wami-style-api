import 'reflect-metadata';

import cors from 'cors';
import express from 'express';
import { buildSchema } from 'type-graphql';
import { ApolloServer } from 'apollo-server-express';

import { ProductResolver, UserResolver } from './resolvers';
import { createDBConnection } from './database';
import { createAndGetFirstUser } from './entities';
import multer from 'multer';

import path from 'path';
import { storage } from './configs/upload';
import UploadController from './controllers/uploadController';

const port = process.env.PORT || 4000;

async function main() {
  const app = express();

  var upload = multer({ storage });

  // app.use('/files', (req, res) => res.json({ ok: true }));

  app.use(cors());
  app.use(express.json());

  app.post(
    '/files/:productId',
    upload.single('image'),
    UploadController.uploadFile
  );

  app.use('/files', express.static(path.join(__dirname, 'tmp', 'uploads')));

  await createDBConnection();

  const users = await createAndGetFirstUser();

  const schema = await buildSchema({
    resolvers: [UserResolver, ProductResolver],
  });
  const server = new ApolloServer({
    schema,
    introspection: true,
    playground: true,
  });

  server.applyMiddleware({ app });

  app.get('/', async (_, response) => {
    return response.json({ data: users, message: 'Server is ON' });
  });

  app.listen({ port }, () =>
    console.log(
      `Server is run at port ${port}  graphQLPAth ${server.graphqlPath}`
    )
  );
}

main();
