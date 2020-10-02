# Snippet Store

A web app to store text snippets that can be copied with a single click.

Originally created to aid the tutors of COMP10001 in their endless duel against
the grok live help!

The server is implemented using [Node.js] and [Express], along with [DynamoDB] as
the database.

The frontend uses the [Bulma.io] CSS framework along with [Pug] and [SCSS]. Fuzzy search
functionality is provided by the [Fuse.js] library. The project uses [Webpack]
to build the frontend assets.

It supports easy deployment to AWS via [Terraform].

[Bulma.io]: http://bulma.io
[Express]: https://expressjs.com
[Fuse.js]: http://fusejs.io
[Node.js]: https://nodejs.org
[Pug]: https://pugjs.org
[SCSS]: https://sass-lang.com
[Webpack]: https://webpack.js.org
[Terraform]: https://www.terraform.io
[DynamoDB]: https://aws.amazon.com/dynamodb
