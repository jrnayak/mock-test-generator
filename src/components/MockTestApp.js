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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-3 py-4 sm:px-6 sm:py-8 max-w-5xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 sm:p-6 text-white">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-1 sm:mb-2">
              🎓 Mock Test Generator
            </h1>
            <p className="text-center text-purple-100 text-xs sm:text-sm">
              Customizable Math Tests
            </p>
          </div>

          <div className="p-3 sm:p-6"

        {/* Topic Selection and Controls */}
        <div className="mb-4 sm:mb-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none bg-white shadow-sm transition-all"
              disabled={isActive}
            >
              <option value="">📚 Default FDP Questions</option>
              {topics.map((topic, idx) => (
                <option key={idx} value={topic.name}>
                  📝 {topic.name} ({topic.questions && topic.questions.length ? topic.questions.length : 0} questions)
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={startNewTopic}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 flex items-center justify-center gap-2 text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isActive}
              >
                <Plus size={18} />
                <span>New Topic</span>
              </button>
              <button
                onClick={addMoreQuestions}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2 text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isActive || !selectedTopic}
              >
                <Plus size={18} />
                <span>Add Questions</span>
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 flex items-center justify-center shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isActive}
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300 shadow-inner">
              <h3 className="font-bold mb-3 text-blue-700 text-base flex items-center gap-2">
                <Settings size={18} />
                Settings
              </h3>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white p-3 rounded-lg">
                  <label className="text-sm font-semibold text-gray-700">⏱️ Timer Duration (minutes):</label>
                  <input
                    type="number"
                    value={customTime}
                    onChange={(e) => setCustomTime(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm text-center font-semibold"
                    min="1"
                    max="120"
                  />
                  <button
                    onClick={updateTimer}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 text-sm font-semibold shadow-md transition-all"
                  >
                    Apply
                  </button>
                </div>
                
                {selectedTopic && (
                  <div className="pt-3 border-t-2 border-blue-200">
                    <h4 className="font-semibold mb-2 text-blue-700 text-sm">Manage Current Topic</h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => editTopic(topics.find(t => t.name === selectedTopic))}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 text-sm font-semibold shadow-md transition-all"
                      >
                        <Edit2 size={16} />
                        Edit Topic
                      </button>
                      <button
                        onClick={() => deleteTopic(selectedTopic)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 text-sm font-semibold shadow-md transition-all"
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
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border-2 border-green-300 shadow-inner">
              <h3 className="font-bold mb-3 text-green-700 text-base flex items-center gap-2">
                {editingTopic?.originalName ? <Edit2 size={18} /> : <Plus size={18} />}
                {editingTopic?.originalName ? 'Edit Topic' : 'Create New Topic'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">📌 Topic Name:</label>
                  <input
                    type="text"
                    value={editingTopic?.name || ''}
                    onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                    placeholder="e.g., Year 5 Algebra"
                    className="w-full px-4 py-2.5 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">📝 Questions (one per line):</label>
                  <textarea
                    value={topicQuestions}
                    onChange={(e) => setTopicQuestions(e.target.value)}
                    placeholder="Paste or type sample questions here, one per line&#10;e.g., Convert 3/4 to a decimal&#10;What is 25% of 80?"
                    rows="6"
                    className="w-full px-4 py-2.5 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none font-mono text-sm bg-white"
                  />
                  <p className="text-xs text-gray-600 mt-1.5 flex items-center gap-1">
                    <span className="font-semibold text-green-600">{topicQuestions.split('\n').filter(q => q.trim()).length}</span> questions entered
                  </p>
                </div>
                
                {/* AI Generation Section */}
                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg border-2 border-purple-300">
                  <h4 className="font-semibold mb-2 text-purple-700 text-sm flex items-center gap-1.5">
                    ✨ AI Question Generator
                  </h4>
                  <p className="text-xs text-gray-600 mb-2.5">
                    Add a few sample questions above, then AI will generate similar ones
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold whitespace-nowrap text-gray-700">Generate:</label>
                      <input
                        type="number"
                        value={numQuestionsToGenerate}
                        onChange={(e) => setNumQuestionsToGenerate(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                        className="w-16 px-2 py-1.5 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none text-sm text-center font-semibold"
                        min="1"
                        max="50"
                      />
                      <span className="text-xs text-gray-600">questions</span>
                    </div>
                    <button
                      onClick={generateQuestionsWithAI}
                      disabled={isGenerating || !topicQuestions.trim()}
                      className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md transition-all"
                    >
                      {isGenerating ? '⏳ Generating...' : '✨ Generate with AI'}
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={saveTopic}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-semibold text-sm shadow-md transition-all"
                  >
                    💾 Save Topic
                  </button>
                  <button
                    onClick={() => {
                      setShowTopicManager(false);
                      setEditingTopic(null);
                      setTopicQuestions('');
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 text-sm shadow-md transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timer and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 sm:mb-5 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl border-2 border-blue-200 shadow-md">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
            <Clock className="text-blue-600" size={24} />
            <span className={`text-2xl sm:text-3xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          
          {!isActive && !submitted && (
            <button
              onClick={startTest}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-bold text-base shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              🚀 Start Test
            </button>
          )}

          {submitted && (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="text-xl font-bold bg-white px-4 py-2 rounded-lg shadow-sm">
                <span className="text-purple-600">Score: {score}/10</span>
                <span className="text-gray-400 mx-2">•</span>
                <span className={`${score >= 7 ? 'text-green-600' : score >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {Math.round((score / 10) * 100)}%
                </span>
              </div>
              <button
                onClick={resetTest}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 font-semibold shadow-md hover:shadow-lg transition-all"
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
            <div className="text-center p-8 sm:p-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-gray-600 text-sm sm:text-base font-medium">Click "Start Test" to generate questions</p>
            </div>
          )}
          {questions.map((q, index) => (
            <div
              key={q.id}
              className={`p-4 sm:p-5 rounded-xl border-2 shadow-md transition-all ${
                submitted && q.answer
                  ? (answers[q.id] || '').trim().toLowerCase() === q.answer.toLowerCase()
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400'
                    : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-400'
                  : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm sm:text-base ${
                  submitted && q.answer
                    ? (answers[q.id] || '').trim().toLowerCase() === q.answer.toLowerCase()
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                    : 'bg-purple-500 text-white'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <p className="text-sm sm:text-base md:text-lg mb-3 text-gray-800 font-medium break-words leading-relaxed">{q.question}</p>
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    disabled={!isActive || submitted}
                    className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none disabled:bg-gray-100 text-sm sm:text-base transition-all"
                    placeholder="Your answer"
                  />
                  {submitted && q.answer && (
                    <div className="mt-3 flex items-center gap-2">
                      {(answers[q.id] || '').trim().toLowerCase() === q.answer.toLowerCase() ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-100 px-3 py-1.5 rounded-lg">
                          <CheckCircle size={18} className="flex-shrink-0" />
                          <span className="font-semibold text-sm">Correct!</span>
                        </div>
                      ) : (
                        <div className="text-red-600">
                          <div className="flex items-center gap-2 bg-red-100 px-3 py-1.5 rounded-lg mb-1.5">
                            <XCircle size={18} className="flex-shrink-0" />
                            <span className="font-semibold text-sm">Incorrect</span>
                          </div>
                          <p className="text-xs bg-red-50 px-3 py-1.5 rounded-lg break-words border-l-4 border-red-400">
                            <span className="font-semibold">Correct answer:</span> {q.answer}
                          </p>
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
            className="w-full mt-5 sm:mt-6 px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
          >
            ✓ Submit Test
          </button>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockTestApp;