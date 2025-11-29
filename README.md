markdown
# Mock Test Generator

An interactive math test generator with customizable topics, AI-powered question generation, and timer functionality.

## Features

- Create custom topics with sample questions
- Upload PDF files to extract questions
- AI-powered question generation based on sample questions
- Customizable timer (default 6 minutes)
- Edit and delete topics
- Add more questions to existing topics
- Persistent storage using localStorage
- Instant feedback on test submission

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone 
cd mock-test-generator
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Click "Deploy"

## Usage

1. **Create a Topic**: Click "New Topic", add a topic name and questions
2. **Upload PDF**: Upload a PDF with sample questions for extraction
3. **AI Generation**: Use AI to generate similar questions based on samples
4. **Start Test**: Select a topic and click "Start Test"
5. **Submit**: Answer questions and click "Submit Test"

## Technologies Used

- Next.js 14
- React 18
- Tailwind CSS
- Lucide React Icons
- Claude AI API

## License

MIT
# mock-test-generator
