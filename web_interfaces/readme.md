# UI

## Once off npm global change default dir to avoid permissions issues
```
mkdir ~/.npm-global\n
npm config set prefix '~/.npm-global'\n
vim ~/.zshrc
source ~/.zshrc
npm install -g create-react-app\n
```

## Project Init - React + Typescript
```
npx create-react-app my-react-app --template typescript
```

## Adding drag and drop
```
npm install react-dnd react-dnd-html5-backend react-dnd-preview
npm install react-dnd-touch-backend
npm install is-touch-device
npm i --save-dev @types/is-touch-device
```

# Github.io
```
npm install gh-pages --save-dev

"scripts": {
    .....
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
},

npm run deploy
```