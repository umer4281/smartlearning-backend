import React, { useState, useEffect, useRef } from 'react';
import { testAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Tests = () => {
  const { isTeacher, isAdmin, isStudent } = useAuth();
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
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [showReview, setShowReview] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [reviewingPast, setReviewingPast] = useState(false); // reviewing a past submission
  const [filterTestId, setFilterTestId] = useState(null); // admin: filter results by test
  const timerRef = useRef(null);
  const hasAutoSubmitted = useRef(false);
  const resultsSectionRef = useRef(null);

  useEffect(() => {
    loadTests();
    if (isStudent) {
      loadMyResults();
    } else {
      loadAllResults();
    }
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (!selectedTest || result || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [selectedTest, result, timeRemaining > 0]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (selectedTest && !result && timeRemaining === 0 && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      setAutoSubmitted(true);
      submitTest();
    }
  }, [timeRemaining, selectedTest, result]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
    // Only students can take tests
    if (!isStudent) return;

    // Check if student already submitted this test
    const alreadySubmitted = myResults.some((r) => r.test?._id === testId);
    if (alreadySubmitted) {
      setMessage('You have already submitted this test. You cannot take it again.');
      return;
    }

    try {
      const res = await testAPI.getById(testId);
      setSelectedTest(res.data);
      setAnswers({});
      setResult(null);
      setShowReview(false);
      setAutoSubmitted(false);
      setReviewingPast(false);
      hasAutoSubmitted.current = false;
      setMessage('');
      // Initialize timer (convert minutes to seconds)
      const timeLimit = res.data.timeLimit || 0;
      if (timeLimit > 0) {
        setTimeRemaining(timeLimit * 60);
      } else {
        setTimeRemaining(0);
      }
    } catch (err) {
      console.error('Error loading test:', err);
    }
  };

  // Review a past submission (student)
  const reviewPastResult = async (resultItem) => {
    try {
      const res = await testAPI.getById(resultItem.test._id);
      setSelectedTest(res.data);
      setResult({
        testResult: resultItem,
        score: resultItem.score,
        totalPoints: resultItem.totalPoints,
        percentage: resultItem.percentage,
      });
      setShowReview(true);
      setReviewingPast(true);
      setAutoSubmitted(false);
      setMessage('');
    } catch (err) {
      console.error('Error loading test for review:', err);
      setMessage('Error loading test for review. The test may have been deleted.');
    }
  };

  const handleAnswerChange = (questionIndex, optionIndex) => {
    setAnswers({ ...answers, [questionIndex]: optionIndex });
  };

  const submitTest = async () => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      const answerArray = selectedTest.questions.map((_, index) =>
        answers[index] !== undefined ? answers[index] : -1
      );
      const res = await testAPI.submit(selectedTest._id, answerArray);
      setResult(res.data);
      setShowReview(false);
      setReviewingPast(false);
      setMessage('');
      loadMyResults();
    } catch (err) {
      if (err.response?.data?.alreadySubmitted) {
        setMessage(err.response.data.message || 'You have already submitted this test.');
        setSelectedTest(null);
        loadMyResults();
      } else {
        setMessage(err.response?.data?.message || 'Error submitting test');
      }
    }
  };

  const exitTest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setSelectedTest(null);
    setResult(null);
    setShowReview(false);
    setTimeRemaining(0);
    setAutoSubmitted(false);
    setReviewingPast(false);
    hasAutoSubmitted.current = false;
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

  // Delete test (admin only)
  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test? All related results will also be deleted.')) {
      return;
    }
    try {
      await adminAPI.deleteTest(testId);
      setMessage('Test deleted successfully');
      loadTests();
      loadAllResults();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error deleting test');
    }
  };

  // Filter results by test (admin)
  const filterResultsByTest = (testId) => {
    setFilterTestId(testId);
    // Scroll to results section
    setTimeout(() => {
      if (resultsSectionRef.current) {
        resultsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const clearFilter = () => {
    setFilterTestId(null);
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
  };

  // Get the correct option index for a question
  const getCorrectOptionIndex = (question) => {
    return question.options.findIndex((o) => o.isCorrect);
  };

  // Get the student's selected option index for a question
  const getStudentAnswer = (qIndex) => {
    if (result?.testResult?.answers?.[qIndex]) {
      return result.testResult.answers[qIndex].selectedOption;
    }
    return answers[qIndex] !== undefined ? answers[qIndex] : -1;
  };

  // Get submission count for a test (admin)
  const getSubmissionCount = (testId) => {
    return allResults.filter((r) => r.test?._id === testId).length;
  };

  // Get filtered results for admin
  const getFilteredResults = () => {
    if (filterTestId) {
      return allResults.filter((r) => r.test?._id === filterTestId);
    }
    return allResults;
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <h4 className="mb-0">📝 Online Tests</h4>
        </div>
        <div className="card-body">
          {message && (
            <div className={`alert ${message.includes('Error') || message.includes('delete') ? 'alert-danger' : 'alert-success'}`}>
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

          {/* FIX: Check result FIRST so the result/review view shows after submission */}
          {result ? (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">{reviewingPast ? '📋 Test Review' : 'Test Result'}</h5>
              </div>
              <div className="card-body text-center">
                {autoSubmitted && !reviewingPast && (
                  <div className="alert alert-warning mb-3">
                    ⏰ Time ran out! Your answers were submitted automatically.
                  </div>
                )}
                <h1 className={`display-1 text-${getScoreColor(result.percentage)}`}>
                  {result.percentage}%
                </h1>
                <p className="lead">
                  Score: {result.score} / {result.totalPoints}
                </p>
                <div className="d-flex justify-content-center gap-2 flex-wrap mt-3">
                  <button
                    className="btn btn-info"
                    onClick={() => setShowReview(!showReview)}
                  >
                    {showReview ? ' Hide Review' : '📋 Review Answers'}
                  </button>
                  <button className="btn btn-primary" onClick={exitTest}>
                    Back to Tests
                  </button>
                </div>
              </div>

              {showReview && selectedTest && (
                <div className="card-body border-top">
                  <h5 className="mb-3">📋 Answer Review</h5>
                  {selectedTest.questions.map((q, qIndex) => {
                    const studentAnswer = getStudentAnswer(qIndex);
                    const correctAnswer = getCorrectOptionIndex(q);
                    const isCorrect = result?.testResult?.answers?.[qIndex]?.isCorrect ?? (studentAnswer === correctAnswer);

                    return (
                      <div key={qIndex} className={`review-question-card ${isCorrect ? 'review-correct' : 'review-wrong'}`}>
                        <div className="review-question-header">
                          <h6 className="mb-1">
                            Q{qIndex + 1}. {q.questionText}
                          </h6>
                          <span className={`review-badge ${isCorrect ? 'badge-correct' : 'badge-wrong'}`}>
                            {isCorrect ? '✓ Correct' : '✗ Wrong'}
                          </span>
                        </div>
                        <p className="text-muted mb-2">
                          <small>Points: {q.points}</small>
                        </p>
                        <div className="review-options">
                          {q.options.map((opt, oIndex) => {
                            const isStudentAnswer = oIndex === studentAnswer;
                            const isCorrectAnswer = oIndex === correctAnswer;

                            let className = 'review-option';
                            if (isCorrectAnswer) {
                              className += ' review-option-correct';
                            }
                            if (isStudentAnswer && !isCorrectAnswer) {
                              className += ' review-option-wrong';
                            }
                            if (isStudentAnswer && isCorrectAnswer) {
                              className += ' review-option-selected-correct';
                            }

                            return (
                              <div key={oIndex} className={className}>
                                <span className="review-option-text">{opt.optionText}</span>
                                <div className="review-option-badges">
                                  {isCorrectAnswer && (
                                    <span className="review-tag review-tag-correct">
                                      ✓ Correct Answer
                                    </span>
                                  )}
                                  {isStudentAnswer && (
                                    <span className={`review-tag ${isCorrectAnswer ? 'review-tag-your-correct' : 'review-tag-your-wrong'}`}>
                                      Your Answer
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {studentAnswer === -1 && (
                          <p className="text-muted mt-2 mb-0">
                            <small><em>You did not answer this question.</em></small>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : selectedTest ? (
            <div>
              <button className="btn btn-secondary mb-3" onClick={exitTest}>
                ← Back to Tests
              </button>
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h5 className="mb-0">{selectedTest.title}</h5>
                    <p className="mb-0 text-muted">
                      Questions: {selectedTest.questions.length}
                    </p>
                  </div>
                  {selectedTest.timeLimit > 0 && !result && (
                    <div className={`test-timer ${timeRemaining < 60 ? 'test-timer-danger' : timeRemaining < 300 ? 'test-timer-warning' : ''}`}>
                      <span className="test-timer-icon">⏱️</span>
                      <span className="test-timer-text">{formatTime(timeRemaining)}</span>
                    </div>
                  )}
                </div>
                <div className="card-body">
                  {autoSubmitted && !result && (
                    <div className="alert alert-warning">
                      ⏰ Time's up! Your answers are being submitted automatically...
                    </div>
                  )}
                  {selectedTest.questions.map((q, qIndex) => (
                    <div key={qIndex} className="mb-4">
                      <h6>
                        Q{qIndex + 1}. {q.questionText} ({q.points} point{q.points > 1 ? 's' : ''})
                      </h6>
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="form-check exam-option">
                          <input
                            className="form-check-input exam-radio"
                            type="radio"
                            name={`question-${qIndex}`}
                            checked={answers[qIndex] === oIndex}
                            onChange={() => handleAnswerChange(qIndex, oIndex)}
                            disabled={result !== null}
                          />
                          <label className="form-check-label exam-option-label">{opt.optionText}</label>
                        </div>
                      ))}
                    </div>
                  ))}
                  {!result && (
                    <button className="btn btn-primary" onClick={submitTest}>
                      Submit Test
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {isStudent ? (
                /* STUDENT VIEW: Available Tests with Start Test */
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
                              {myResults.some((r) => r.test?._id === test._id) ? (
                                <button className="btn btn-success" disabled>
                                  ✓ Submitted
                                </button>
                              ) : (
                                <button
                                  className="btn btn-primary"
                                  onClick={() => startTest(test._id)}
                                >
                                  Start Test
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* ADMIN/TEACHER VIEW: Test Management */
                <div>
                  <h5>Test Management</h5>
                  {tests.length === 0 ? (
                    <p className="text-muted">No tests available. Create a new test to get started.</p>
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
                              <p>
                                <small>
                                  <strong>Submissions:</strong> {getSubmissionCount(test._id)}
                                </small>
                              </p>
                              {test.createdBy && (
                                <p>
                                  <small className="text-muted">
                                    Created by: {test.createdBy.name}
                                  </small>
                                </p>
                              )}
                              <div className="d-flex gap-2 flex-wrap">
                                <button
                                  className="btn btn-info btn-sm"
                                  onClick={() => filterResultsByTest(test._id)}
                                >
                                  📊 View Submissions
                                </button>
                                {isAdmin && (
                                  <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleDeleteTest(test._id)}
                                  >
                                    🗑 Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <hr ref={resultsSectionRef} />

              {isStudent ? (
                /* STUDENT: My Results with Review button */
                <div>
                  <h5>My Results</h5>
                  {myResults.length === 0 ? (
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
                            <th>Review</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myResults.map((r) => (
                            <tr key={r._id}>
                              <td data-label="Test">{r.test?.title}</td>
                              <td data-label="Score">{r.score}/{r.totalPoints}</td>
                              <td data-label="Percentage">
                                <span className={`badge bg-${getScoreColor(r.percentage)}`}>
                                  {r.percentage}%
                                </span>
                              </td>
                              <td data-label="Date">{new Date(r.submittedAt).toLocaleDateString()}</td>
                              <td data-label="Review">
                                <button
                                  className="btn btn-outline-info btn-sm"
                                  onClick={() => reviewPastResult(r)}
                                >
                                  📋 Review Answers
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* ADMIN/TEACHER: All Student Results */
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">
                      All Student Results
                      {filterTestId && (
                        <button
                          className="btn btn-outline-secondary btn-sm ms-2"
                          onClick={clearFilter}
                        >
                          ✖ Clear Filter
                        </button>
                      )}
                    </h5>
                  </div>
                  {allResults.length === 0 ? (
                    <p className="text-muted">No results yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Test</th>
                            <th>Student</th>
                            <th>Score</th>
                            <th>Percentage</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredResults().map((r) => (
                            <tr key={r._id}>
                              <td data-label="Test">{r.test?.title}</td>
                              <td data-label="Student">{r.student?.name || 'Unknown'}</td>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Tests;