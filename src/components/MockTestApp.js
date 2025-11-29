'use client'

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, RefreshCw, Plus, Settings, Trash2, Edit2 } from 'lucide-react';

const MockTestApp = () => {
  const [timeLeft, setTimeLeft] = useState(360);
  const [customTime, setCustomTime] = useState(6);
  const [isActive, setIsActive] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showTopicManager, setShowTopicManager] = useState(false);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicQuestions, setTopicQuestions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [numQuestionsToGenerate, setNumQuestionsToGenerate] = useState(10);

  // Load topics from localStorage
  useEffect(() => {
    const loadTopics = () => {
      try {
        const stored = localStorage.getItem('quiz-topics');
        if (stored) {
          const loadedTopics = JSON.parse(stored);
          setTopics(loadedTopics);
          if (loadedTopics.length > 0) {
            setSelectedTopic(loadedTopics[0].name);
          }
        }
      } catch (error) {
        console.log('No topics found, starting fresh');
      }
    };
    loadTopics();
  }, []);

  // Save topics to localStorage
  const saveTopics = (updatedTopics) => {
    try {
      localStorage.setItem('quiz-topics', JSON.stringify(updatedTopics));
      setTopics(updatedTopics);
    } catch (error) {
      console.error('Error saving topics:', error);
      alert('Error saving topics. Please try again.');
    }
  };

  const startNewTopic = () => {
    setEditingTopic({ name: '', questions: [] });
    setTopicQuestions('');
    setShowTopicManager(true);
  };

  const editTopic = (topic) => {
    setEditingTopic(topic);
    setTopicQuestions(topic.questions && topic.questions.length ? topic.questions.join('\n') : '');
    setShowTopicManager(true);
  };

  const generateQuestionsWithAI = async () => {
    if (!topicQuestions.trim()) {
      alert('Please provide some sample questions first');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Based on these sample questions, generate ${numQuestionsToGenerate} similar questions for a Year 5 math test. Keep the same style, difficulty level, and format.

Sample questions:
${topicQuestions}

Generate ONLY the questions, one per line, without numbering or explanations.`
            }
          ],
        })
      });

      const data = await response.json();
      
      if (data.content && data.content[0] && data.content[0].text) {
        const generatedQuestions = data.content[0].text.trim();
        const existingQuestions = topicQuestions.trim();
        const combined = existingQuestions + '\n' + generatedQuestions;
        setTopicQuestions(combined);
        alert(`${numQuestionsToGenerate} questions generated successfully!`);
      } else {
        alert('Could not generate questions. Please try again.');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Error generating questions. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveTopic = () => {
    if (!editingTopic.name.trim() || !topicQuestions.trim()) {
      alert('Please enter both topic name and questions');
      return;
    }

    const questionsList = topicQuestions.split('\n').filter(q => q.trim());
    
    if (questionsList.length === 0) {
      alert('Please add at least one question');
      return;
    }

    const updatedTopic = {
      name: editingTopic.name.trim(),
      questions: questionsList,
      dateModified: new Date().toISOString()
    };

    let updatedTopics;
    const existingIndex = topics.findIndex(t => t.name === editingTopic.originalName || t.name === editingTopic.name);
    
    if (existingIndex >= 0) {
      updatedTopics = [...topics];
      updatedTopics[existingIndex] = updatedTopic;
    } else {
      updatedTopics = [...topics, updatedTopic];
    }

    saveTopics(updatedTopics);
    setSelectedTopic(updatedTopic.name);
    setEditingTopic(null);
    setTopicQuestions('');
    setShowTopicManager(false);
    alert('Topic saved successfully!');
  };

  const addMoreQuestions = () => {
    const topic = topics.find(t => t.name === selectedTopic);
    if (topic) {
      editTopic({ ...topic, originalName: topic.name, questions: topic.questions || [] });
    }
  };

  const deleteTopic = (topicName) => {
    if (confirm(`Are you sure you want to delete "${topicName}"?`)) {
      const updatedTopics = topics.filter(t => t.name !== topicName);
      saveTopics(updatedTopics);
      if (selectedTopic === topicName) {
        setSelectedTopic(updatedTopics.length > 0 ? updatedTopics[0].name : '');
      }
    }
  };

  const generateQuestionsFromTopic = () => {
    const topic = topics.find(t => t.name === selectedTopic);
    if (!topic || !topic.questions || topic.questions.length === 0) {
      return generateDefaultQuestions();
    }

    const newQuestions = [];
    const availableQuestions = [...topic.questions];
    
    for (let i = 0; i < Math.min(10, availableQuestions.length); i++) {
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const question = availableQuestions.splice(randomIndex, 1)[0];
      newQuestions.push({
        id: i,
        question: question,
        answer: '',
        type: 'input'
      });
    }

    return newQuestions;
  };

  const generateDefaultQuestions = () => {
    const questionTypes = [
      {
        generate: () => {
          const denominators = [2, 4, 5, 8, 10, 20, 25, 50, 100];
          const denom = denominators[Math.floor(Math.random() * denominators.length)];
          const num = Math.floor(Math.random() * (denom - 1)) + 1;
          return {
            question: `Convert ${num}/${denom} to a decimal`,
            answer: (num / denom).toFixed(2).replace(/\.?0+$/, ''),
            type: 'input'
          };
        }
      },
      {
        generate: () => {
          const decimals = [0.25, 0.5, 0.75, 0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.7];
          const dec = decimals[Math.floor(Math.random() * decimals.length)];
          const fractions = {
            0.25: '1/4', 0.5: '1/2', 0.75: '3/4',
            0.2: '1/5', 0.4: '2/5', 0.6: '3/5', 0.8: '4/5',
            0.1: '1/10', 0.3: '3/10', 0.7: '7/10'
          };
          return {
            question: `Convert ${dec} to a fraction in its simplest form`,
            answer: fractions[dec],
            type: 'input'
          };
        }
      },
      {
        generate: () => {
          const percentages = [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];
          const perc = percentages[Math.floor(Math.random() * percentages.length)];
          return {
            question: `Convert ${perc}% to a decimal`,
            answer: (perc / 100).toString(),
            type: 'input'
          };
        }
      },
      {
        generate: () => {
          const percentages = [10, 20, 25, 50, 75];
          const amounts = [100, 200, 400, 500, 800, 1000];
          const perc = percentages[Math.floor(Math.random() * percentages.length)];
          const amount = amounts[Math.floor(Math.random() * amounts.length)];
          return {
            question: `Calculate ${perc}% of ${amount}`,
            answer: ((perc / 100) * amount).toString(),
            type: 'input'
          };
        }
      }
    ];

    const newQuestions = [];
    for (let i = 0; i < 10; i++) {
      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      newQuestions.push({ id: i, ...questionType.generate() });
    }
    return newQuestions;
  };

  const generateQuestions = () => {
    const newQuestions = generateQuestionsFromTopic();
    setQuestions(newQuestions);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setTimeLeft(customTime * 60);
    setIsActive(false);
  };

  useEffect(() => {
    if (topics.length === 0) {
      generateQuestions();
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleSubmit();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const startTest = () => {
    if (questions.length === 0) {
      generateQuestions();
    }
    setIsActive(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (id, value) => {
    setAnswers({ ...answers, [id]: value });
  };

  const handleSubmit = () => {
    setIsActive(false);
    setSubmitted(true);
    let correctCount = 0;
    questions.forEach(q => {
      if (q.answer) {
        const userAnswer = (answers[q.id] || '').trim().toLowerCase();
        const correctAnswer = q.answer.toLowerCase();
        if (userAnswer === correctAnswer) {
          correctCount++;
        }
      }
    });
    setScore(correctCount);
  };

  const resetTest = () => {
    generateQuestions();
  };

  const updateTimer = () => {
    setTimeLeft(customTime * 60);
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-4 px-2 sm:p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-3 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-purple-700">
          Mock Test Generator
        </h1>
        <p className="text-center text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
          Customizable Math Tests
        </p>

        {/* Topic Selection and Controls */}
        <div className="mb-4 sm:mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="flex-1 px-3 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              disabled={isActive}
            >
              <option value="">Default FDP Questions</option>
              {topics.map((topic, idx) => (
                <option key={idx} value={topic.name}>
                  {topic.name} ({topic.questions && topic.questions.length ? topic.questions.length : 0} questions)
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={startNewTopic}
                className="flex-1 sm:flex-none px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2 text-sm sm:text-base"
                disabled={isActive}
              >
                <Plus size={18} />
                <span className="sm:inline">New Topic</span>
              </button>
              <button
                onClick={addMoreQuestions}
                className="flex-1 sm:flex-none px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 text-sm sm:text-base"
                disabled={isActive || !selectedTopic}
              >
                <Plus size={18} />
                <span className="sm:inline">Add Questions</span>
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2"
                disabled={isActive}
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <h3 className="font-bold mb-3 text-blue-700 text-sm sm:text-base">Settings</h3>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <label className="text-xs sm:text-sm font-semibold">Timer Duration (minutes):</label>
                  <input
                    type="number"
                    value={customTime}
                    onChange={(e) => setCustomTime(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                    min="1"
                    max="120"
                  />
                  <button
                    onClick={updateTimer}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Apply
                  </button>
                </div>
                
                {selectedTopic && (
                  <div className="pt-3 border-t border-blue-200">
                    <h4 className="font-semibold mb-2 text-blue-700 text-sm sm:text-base">Manage Current Topic</h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => editTopic(topics.find(t => t.name === selectedTopic))}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                      >
                        <Edit2 size={16} />
                        Edit Topic
                      </button>
                      <button
                        onClick={() => deleteTopic(selectedTopic)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                      >
                        <Trash2 size={16} />
                        Delete Topic
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Topic Manager Panel */}
          {showTopicManager && (
            <div className="p-3 sm:p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <h3 className="font-bold mb-3 text-green-700 text-sm sm:text-base">
                {editingTopic?.originalName ? 'Edit Topic' : 'Create New Topic'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1">Topic Name:</label>
                  <input
                    type="text"
                    value={editingTopic?.name || ''}
                    onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                    placeholder="e.g., Year 5 Algebra"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1">Questions (one per line):</label>
                  <textarea
                    value={topicQuestions}
                    onChange={(e) => setTopicQuestions(e.target.value)}
                    placeholder="Paste or type sample questions here, one per line&#10;e.g., Convert 3/4 to a decimal&#10;What is 25% of 80?"
                    rows="8"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-xs sm:text-sm"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    {topicQuestions.split('\n').filter(q => q.trim()).length} questions entered
                  </p>
                </div>
                
                {/* AI Generation Section */}
                <div className="p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h4 className="font-semibold mb-2 text-purple-700 text-xs sm:text-sm">✨ AI Question Generator</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    Add a few sample questions above, then AI will generate similar ones
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs sm:text-sm font-semibold whitespace-nowrap">Generate:</label>
                      <input
                        type="number"
                        value={numQuestionsToGenerate}
                        onChange={(e) => setNumQuestionsToGenerate(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                        className="w-16 px-2 py-1 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                        min="1"
                        max="50"
                      />
                      <span className="text-xs sm:text-sm">questions</span>
                    </div>
                    <button
                      onClick={generateQuestionsWithAI}
                      disabled={isGenerating || !topicQuestions.trim()}
                      className="flex-1 sm:flex-none px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed text-xs sm:text-sm"
                    >
                      {isGenerating ? 'Generating...' : '✨ Generate with AI'}
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={saveTopic}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold text-sm"
                  >
                    Save Topic
                  </button>
                  <button
                    onClick={() => {
                      setShowTopicManager(false);
                      setEditingTopic(null);
                      setTopicQuestions('');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timer and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-100 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600" size={20} />
            <span className={`text-xl sm:text-2xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          
          {!isActive && !submitted && (
            <button
              onClick={startTest}
              className="w-full sm:w-auto px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold text-sm sm:text-base"
            >
              Start Test
            </button>
          )}

          {submitted && (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="text-lg sm:text-xl font-bold text-purple-600">
                Score: {score}/10 ({Math.round((score / 10) * 100)}%)
              </div>
              <button
                onClick={resetTest}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm sm:text-base"
              >
                <RefreshCw size={18} />
                New Test
              </button>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-3 sm:space-y-4">
          {questions.length === 0 && !isActive && (
            <div className="text-center p-6 sm:p-8 bg-gray-50 rounded-lg border-2 border-gray-200">
              <p className="text-gray-600 text-sm sm:text-base">Click "Start Test" to generate questions</p>
            </div>
          )}
          {questions.map((q, index) => (
            <div
              key={q.id}
              className={`p-3 sm:p-4 rounded-lg border-2 ${
                submitted && q.answer
                  ? (answers[q.id] || '').trim().toLowerCase() === q.answer.toLowerCase()
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="font-bold text-base sm:text-lg text-purple-600 min-w-6 sm:min-w-8">
                  {index + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-lg mb-2 sm:mb-3 break-words">{q.question}</p>
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    disabled={!isActive || submitted}
                    className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none disabled:bg-gray-100 text-sm sm:text-base"
                    placeholder="Your answer"
                  />
                  {submitted && q.answer && (
                    <div className="mt-2 flex items-center gap-2">
                      {(answers[q.id] || '').trim().toLowerCase() === q.answer.toLowerCase() ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={18} />
                          <span className="font-semibold text-sm sm:text-base">Correct!</span>
                        </div>
                      ) : (
                        <div className="text-red-600">
                          <div className="flex items-center gap-2">
                            <XCircle size={18} />
                            <span className="font-semibold text-sm sm:text-base">Incorrect</span>
                          </div>
                          <p className="mt-1 text-xs sm:text-sm">Correct answer: {q.answer}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {isActive && !submitted && (
          <button
            onClick={handleSubmit}
            className="w-full mt-4 sm:mt-6 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-semibold text-base sm:text-lg"
          >
            Submit Test
          </button>
        )}
      </div>
    </div>
  );
};

export default MockTestApp;