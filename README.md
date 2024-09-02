# Mafia Online

Do you love to play **Mafia (Warewolf)** with friends but also equally hate when they ask you to be a moderator?  
This tool is for you.

**Mafia Online** can moderate the game for you while you are enjoying with your friends.

Try the website: ![]

## Contribution or Self-hosting

If you wish to host yourself or make changes to code.

### Clone the project

Clone this repository to your local computer 

```bash
# clone repository
git clone https://github.com/namasSinjali/mafia-online
```

### Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

Everything inside `src/lib` is part of your library, everything inside `src/routes` can be used as a showcase or preview app.

### Building

To build your library:

```bash
npm run package
```

To create a production version of your showcase app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

### Publishing

Go into the `package.json` and give your package the desired name through the `"name"` option. Also consider adding a `"license"` field and point it to a `LICENSE` file which you can create from a template (one popular option is the [MIT license](https://opensource.org/license/mit/)).

To publish your library to [npm](https://www.npmjs.com):

```bash
npm publish
```
