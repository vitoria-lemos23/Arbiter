import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client, graphql } from "ponder";

// HTTP API over the indexed data: GraphQL at /graphql and SQL-over-HTTP at
// /sql/*. Ponder requires this file to exist and default-export a Hono app.
const app = new Hono();

app.use("/graphql", graphql({ db, schema }));
app.use("/sql/*", client({ db, schema }));

export default app;
