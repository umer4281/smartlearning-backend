import React, { useState, useEffect } from 'react';
import { testAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Tests = () => {
  const { isTeacher, isAdmin } = useAuth();
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [myResults, setMyResults] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTest, setNewTest] = useState({
    title: '',
    description: '',
    timeLimit: 30,
    questions: [{ questionText: '', points: 1, options: [{ optionText: '', isCorrect: false }] }],
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadTests();
    if (!isTeacher && !isAdmin) {
      loadMyResults();
    } else {
      loadAllResults();
    }
  }, []);

  const loadTests = async () => {
    try {
      const res = await testAPI.getAll();
      setTests(res.data);
    } catch (err) {
      console.error('Error loading tests:', err);
    }
  };

  const loadMyResults = async () => {
    try {
      const res = await testAPI.getMyResults();
      setMyResults(res.data);
    } catch (err) {
      console.error('Error loading results:', err);
    }
  };

  const loadAllResults = async () => {
    try {
      const res = await testAPI.getAllResults();
      setAllResults(res.data);
    } catch (err) {
      console.error('Error loading all results:', err);
    }
  };

  const startTest = async (testId) => {
    try {
      const res = await testAPI.getById(testId);
      setSelectedTest(res.data);
      setAnswers({});
      setResult(null);
    } catch (err) {
      console.error('Error loading test:', err);
    }
  };

  const handleAnswerChange = (questionIndex, optionIndex) => {
    setAnswers({ ...answers, [questionIndex]: optionIndex });
  };

  const submitTest = async () => {
    try {
      const answerArray = selectedTest.questions.map((_, index) =>
        answers[index] !== undefined ? answers[index] : -1
      );
      const res = await testAPI.submit(selectedTest._id, answerArray);
      setResult(res.data);
      loadMyResults();
    } catch (err) {
      setMessage('Error submitting test');
    }
  };

  const addQuestion = () => {
    setNewTest({
      ...newTest,
      questions: [
        ...newTest.questions,
        { questionText: '', points: 1, options: [{ optionText: '', isCorrect: false }] },
      ],
    });
  };

  const addOption = (qIndex) => {
    const questions = [...newTest.questions];
    questions[qIndex].options.push({ optionText: '', isCorrect: false });
    setNewTest({ ...newTest, questions });
  };

  const handleTestChange = (field, value) => {
    setNewTest({ ...newTest, [field]: value });
  };

  const handleQuestionChange = (qIndex, field, value) => {
    const questions = [...newTest.questions];
    questions[qIndex][field] = value;
    setNewTest({ ...newTest, questions });
  };

  const handleOptionChange = (qIndex, oIndex, field, value) => {
    const questions = [...newTest.questions];
    questions[qIndex].options[oIndex][field] = value;
    setNewTest({ ...newTest, questions });
  };

  const createTest = async (e) => {
    e.preventDefault();
    try {
      await testAPI.create(newTest);
      setMessage('Test created successfully!');
      setShowCreateForm(false);
      setNewTest({
        title: '',
        description: '',
        timeLimit: 30,
        questions: [{ questionText: '', points: 1, options: [{ optionText: '', isCorrect: false }] }],
      });
      loadTests();
    } catch (err) {
      setMessage('Error creating test');
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <h4 className="mb-0">📝 Online Tests</h4>
        </div>
        <div className="card-body">
          {message && (
            <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
              {message}
            </div>
          )}

          {(isTeacher || isAdmin) && (
            <div className="mb-3">
              <button
                className="btn btn-warning"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? '✖ Cancel' : '➕ Create New Test'}
              </button>
            </div>
          )}

          {showCreateForm && (
            <div className="card mb-4 border-warning">
              <div className="card-body">
                <h5>Create New Test</h5>
                <form onSubmit={createTest}>
                  <div className="mb-3">
                    <label className="form-label">Test Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTest.title}
                      onChange={(e) => handleTestChange('title', e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      value={newTest.description}
                      onChange={(e) => handleTestChange('description', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Time Limit (minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newTest.timeLimit}
                      onChange={(e) => handleTestChange('timeLimit', parseInt(e.target.value))}
                    />
                  </div>

                  {newTest.questions.map((q, qIndex) => (
                    <div key={qIndex} className="card mb-3 p-3">
                      <h6>Question {qIndex + 1}</h6>
                      <div className="mb-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Question text"
                          value={q.questionText}
                          onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-2">
                        <label className="form-label">Points</label>
                        <input
                          type="number"
                          className="form-control"
                          value={q.points}
                          onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value))}
                        />
                      </div>
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="input-group mb-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder={`Option ${oIndex + 1}`}
                            value={opt.optionText}
                            onChange={(e) => handleOptionChange(qIndex, oIndex, 'optionText', e.target.value)}
                            required
                          />
                          <div className="input-group-text">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={opt.isCorrect}
                              onChange={() => {
                                q.options.forEach((o, i) => {
                                  handleOptionChange(qIndex, i, 'isCorrect', i === oIndex);
                                });
                              }}
                            />
                            <span className="ms-1">Correct</span>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => addOption(qIndex)}
                      >
                        + Add Option
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline-primary me-2" onClick={addQuestion}>
                    + Add Question
                  </button>
                  <button type="submit" className="btn btn-warning">
                    Create Test
                  </button>
                </form>
              </div>
            </div>
          )}

          {selectedTest ? (
            <div>
              <button className="btn btn-secondary mb-3" onClick={() => setSelectedTest(null)}>
                ← Back to Tests
              </button>
              <div className="card">
                <div className="card-header">
                  <h5>{selectedTest.title}</h5>
                  <p className="mb-0 text-muted">
                    Time Limit: {selectedTest.timeLimit} minutes | Questions: {selectedTest.questions.length}
                  </p>
                </div>
                <div className="card-body">
                  {selectedTest.questions.map((q, qIndex) => (
                    <div key={qIndex} className="mb-4">
                      <h6>
                        Q{qIndex + 1}. {q.questionText} ({q.points} point{q.points > 1 ? 's' : ''})
                      </h6>
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name={`question-${qIndex}`}
                            checked={answers[qIndex] === oIndex}
                            onChange={() => handleAnswerChange(qIndex, oIndex)}
                          />
                          <label className="form-check-label">{opt.optionText}</label>
                        </div>
                      ))}
                    </div>
                  ))}
                  <button className="btn btn-primary" onClick={submitTest}>
                    Submit Test
                  </button>
                </div>
              </div>
            </div>
          ) : result ? (
            <div className="card">
              <div className="card-header">
                <h5>Test Result</h5>
              </div>
              <div className="card-body text-center">
                <h1 className={`display-1 text-${getScoreColor(result.percentage)}`}>
                  {result.percentage}%
                </h1>
                <p className="lead">
                  Score: {result.score} / {result.totalPoints}
                </p>
                <button className="btn btn-primary" onClick={() => setResult(null)}>
                  Back to Tests
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h5>Available Tests</h5>
              {tests.length === 0 ? (
                <p className="text-muted">No tests available.</p>
              ) : (
                <div className="row tests-grid">
                  {tests.map((test) => (
                    <div key={test._id} className="col-md-6 mb-3">
                      <div className="card h-100">
                        <div className="card-body">
                          <h5>{test.title}</h5>
                          <p className="text-muted">{test.description}</p>
                          <p>
                            <small>
                              Questions: {test.questions?.length || 'N/A'} | Time: {test.timeLimit} min
                            </small>
                          </p>
                          <button
                            className="btn btn-primary"
                            onClick={() => startTest(test._id)}
                          >
                            Start Test
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <hr />
              <h5>My Results</h5>
              {myResults.length === 0 && allResults.length === 0 ? (
                <p className="text-muted">No results yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Test</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((isTeacher || isAdmin) ? allResults : myResults).map((r) => (
                        <tr key={r._id}>
                          <td data-label="Test">{r.test?.title}</td>
                          <td data-label="Score">{r.score}/{r.totalPoints}</td>
                          <td data-label="Percentage">
                            <span className={`badge bg-${getScoreColor(r.percentage)}`}>
                              {r.percentage}%
                            </span>
                          </td>
                          <td data-label="Date">{new Date(r.submittedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tests;